import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyCommand, type Command, type Root } from '../src/shared/board'
import { recordChange, type Actor } from './activity'
import { isPgEnabled } from './infra/db'
import { orgRepo, projectRepo } from './infra/repositories'
import { revokeOrgKeys } from './keys'
import { pruneShares } from './shares'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, 'data')
const FILE = join(DATA_DIR, 'board.json')

// Accounts own all data, so the board starts empty — each user seeds their own
// org + sample project on sign-up (see server/index.ts).
function defaultRoot(): Root {
  return { orgs: [], projects: [] }
}

function load(): Root {
  if (existsSync(FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(FILE, 'utf8'))
      if (Array.isArray(parsed?.orgs) && Array.isArray(parsed?.projects)) return parsed
    } catch {
      /* fall through to default */
    }
  }
  return defaultRoot()
}

let root: Root = isPgEnabled() ? defaultRoot() : load()
const listeners = new Set<(r: Root) => void>()
let saveTimer: ReturnType<typeof setTimeout> | null = null

/** Warm the whole board into RAM from Postgres (Pg mode only). Called at boot.
 *  Phase 1 keeps the whole root resident; Phase 2 switches to per-project loading. */
export async function hydrateState(): Promise<void> {
  if (!isPgEnabled()) return
  const [orgs, projects] = await Promise.all([orgRepo.all(), projectRepo.all()])
  root = { orgs, projects }
}

function persistFile() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(FILE, JSON.stringify(root, null, 2))
  }, 150)
}

const projectOf = (cmd: Command): string | undefined => {
  if ('projectId' in cmd && cmd.projectId) return cmd.projectId
  if (cmd.type === 'createProject' || cmd.type === 'importProject') return cmd.id
  return undefined
}

/** Write the command's effect to Postgres, mapping each command to the minimal
 *  repo op. FK cascade handles dependent rows on org/project deletion. */
async function persistPg(cmd: Command, after: Root): Promise<void> {
  switch (cmd.type) {
    case 'createOrg': {
      const org = after.orgs.find((o) => o.id === cmd.id)
      if (org) await orgRepo.insert(org)
      return
    }
    case 'renameOrg':
      await orgRepo.rename(cmd.id, after.orgs.find((o) => o.id === cmd.id)?.name ?? cmd.name)
      return
    case 'deleteOrg':
      await orgRepo.delete(cmd.id)
      revokeOrgKeys(cmd.id) // RAM cache (DB rows already cascaded)
      pruneShares(new Set(after.projects.map((p) => p.id)))
      return
    case 'renameProject':
      await projectRepo.rename(cmd.id, after.projects.find((p) => p.id === cmd.id)?.name ?? cmd.name)
      return
    case 'deleteProject':
      await projectRepo.delete(cmd.id)
      pruneShares(new Set(after.projects.map((p) => p.id)))
      return
    default: {
      // createProject / importProject + every board mutation → save the project.
      const pid = projectOf(cmd)
      const p = pid ? after.projects.find((x) => x.id === pid) : undefined
      if (p) await projectRepo.save(p)
    }
  }
}

export function getRoot(): Root {
  return root
}

/**
 * Apply a command, persist it durably, log the change (when an actor is given),
 * and notify listeners. Async so the durable write is awaited before the caller
 * responds (no lost writes on crash); file mode keeps its debounced write.
 */
export async function applyAndBroadcast(cmd: Command, actor?: Actor): Promise<Root> {
  root = applyCommand(root, cmd)
  if (isPgEnabled()) await persistPg(cmd, root)
  else persistFile()
  recordChange(actor, cmd, root)
  listeners.forEach((l) => l(root))
  return root
}

export function onChange(fn: (r: Root) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
