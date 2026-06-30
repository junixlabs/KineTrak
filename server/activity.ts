import { randomUUID } from 'node:crypto'
import type { Command } from '../src/shared/board'
import type { Project } from '../src/store/types'
import { activityRepo } from './infra/repositories'

// ── Activity log ─────────────────────────────────────────────────────────────
// A narrative of who changed what, when — so the human can watch/catch-up on an
// agent operating the board. Attribution comes from the caller (agent key name
// vs signed-in user). A capped in-RAM ring (warmed from Postgres at boot) serves
// fast reads; each entry is written through to Postgres (write-behind).

const CAP = 1000

export interface Actor {
  kind: 'agent' | 'human'
  name: string
}
export interface Activity {
  id: string
  projectId: string
  ts: number
  actor: Actor
  summary: string
  targetId?: string
  /** 'note' = the agent narrating intent; 'change' = a board mutation. */
  kind: 'change' | 'note'
}

let log: Activity[] = []
const listeners = new Set<(a: Activity) => void>()

/** Warm the in-RAM ring from Postgres. Called once at boot. */
export async function hydrateActivity(): Promise<void> {
  log = await activityRepo.recent(CAP)
}

function persist(entry: Activity) {
  // Narration is non-critical — write-behind, never block the broadcast.
  activityRepo.insert(entry).catch((e) => console.error('activity insert failed:', e))
}

export function onActivity(fn: (a: Activity) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function push(entry: Activity) {
  log.push(entry)
  if (log.length > CAP) log = log.slice(-CAP)
  persist(entry)
  listeners.forEach((l) => l(entry))
}

/** Most recent activity for a project (newest last), optionally since a timestamp. */
export function listActivity(projectId: string, since = 0, limit = 200): Activity[] {
  return log.filter((a) => a.projectId === projectId && a.ts > since).slice(-limit)
}

/** Explicit agent/human narration (not tied to a mutation). */
export function recordNote(projectId: string, actor: Actor, message: string) {
  push({ id: randomUUID(), projectId, ts: Date.now(), actor, summary: message.slice(0, 280), kind: 'note' })
}

/** Record a board mutation as a human-readable line. No-op for actor-less calls.
 *  `project` is the affected project's post-state (used to resolve names). */
export function recordChange(actor: Actor | undefined, cmd: Command, project?: Project) {
  if (!actor) return
  const projectId = projectIdOf(cmd)
  if (!projectId) return
  const { summary, targetId } = describe(cmd, project)
  if (!summary) return
  push({ id: randomUUID(), projectId, ts: Date.now(), actor, summary, targetId, kind: 'change' })
}

function projectIdOf(cmd: Command): string | undefined {
  if ('projectId' in cmd && cmd.projectId) return cmd.projectId
  if (cmd.type === 'createProject' || cmd.type === 'importProject') return cmd.id
  return undefined
}

function describe(cmd: Command, project?: Project): { summary: string; targetId?: string } {
  const d = project?.data
  const moduleName = (id?: string) => d?.modules.find((m) => m.id === id)?.name ?? 'a module'
  const featureName = (id?: string) => d?.features.find((f) => f.id === id)?.name ?? 'a feature'
  const nodeLabel = (id?: string) => d?.swimNodes.find((n) => n.id === id)?.label ?? 'a step'
  switch (cmd.type) {
    case 'addModule': return { summary: `added module “${moduleName(cmd.id)}”`, targetId: cmd.id }
    case 'updateModule': return { summary: `updated module “${moduleName(cmd.id)}”`, targetId: cmd.id }
    case 'deleteModule': return { summary: `deleted a module` }
    case 'addFeature': return { summary: `added feature “${featureName(cmd.id)}”`, targetId: cmd.id }
    case 'updateFeature': {
      const st = (cmd.patch as { status?: string } | undefined)?.status
      return { summary: st ? `set “${featureName(cmd.id)}” → ${st}` : `updated feature “${featureName(cmd.id)}”`, targetId: cmd.id }
    }
    case 'deleteFeature': return { summary: `deleted a feature` }
    case 'addSwimNode': return { summary: `added step “${nodeLabel(cmd.id)}”`, targetId: cmd.id }
    case 'updateSwimNode': {
      const st = (cmd.patch as { status?: string } | undefined)?.status
      return { summary: st ? `set step “${nodeLabel(cmd.id)}” → ${st}` : `updated step “${nodeLabel(cmd.id)}”`, targetId: cmd.id }
    }
    case 'updateSwimNodePos': return { summary: `moved step “${nodeLabel(cmd.id)}”`, targetId: cmd.id }
    case 'deleteSwimNode': return { summary: `deleted a step` }
    case 'addSwimEdge': return { summary: `connected two steps` }
    case 'deleteSwimEdge': return { summary: `removed a connection` }
    case 'reorderModules': return { summary: `reordered modules` }
    case 'reorderFeatures': return { summary: `reordered features` }
    case 'createSnapshot': return { summary: `created a snapshot` }
    case 'appendNote': return { summary: `appended a note`, targetId: cmd.id }
    case 'createProject': return { summary: `created the project` }
    default: return { summary: '' }
  }
}
