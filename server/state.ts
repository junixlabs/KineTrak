import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyCommand, type Command, type Root } from '../src/shared/board'
import { cloneData, sampleTemplate } from '../src/store/seed'
import { makeId } from '../src/store/ids'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, 'data')
const FILE = join(DATA_DIR, 'board.json')

function defaultRoot(): Root {
  const org = { id: makeId('org'), name: 'KineTrak' }
  const proj = {
    id: makeId('p'),
    orgId: org.id,
    name: 'KineTrak Platform',
    createdAt: new Date().toISOString(),
    data: cloneData(sampleTemplate),
    snapshots: [],
  }
  return { orgs: [org], projects: [proj] }
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

let root: Root = load()
const listeners = new Set<(r: Root) => void>()
let saveTimer: ReturnType<typeof setTimeout> | null = null

function persist() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(FILE, JSON.stringify(root, null, 2))
  }, 150)
}

export function getRoot(): Root {
  return root
}

/** Apply a command, persist, and notify listeners (WS broadcast). */
export function applyAndBroadcast(cmd: Command): Root {
  root = applyCommand(root, cmd)
  persist()
  listeners.forEach((l) => l(root))
  return root
}

export function onChange(fn: (r: Root) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
