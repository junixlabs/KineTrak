import type { Feature, Module, Release, Role, SwimLane, WorkspaceData } from './types'

/** done / total for a module's features. */
export function moduleProgress(moduleId: string, features: Feature[]): { done: number; total: number; ratio: number } {
  const fs = features.filter((f) => f.moduleId === moduleId)
  const done = fs.filter((f) => f.status === 'done').length
  return { done, total: fs.length, ratio: fs.length ? Math.round((done / fs.length) * 100) : 0 }
}

/** done / total for a release. */
export function releaseProgress(releaseId: string, features: Feature[]): { done: number; total: number; ratio: number } {
  const fs = features.filter((f) => f.releaseId === releaseId)
  const done = fs.filter((f) => f.status === 'done').length
  return { done, total: fs.length, ratio: fs.length ? Math.round((done / fs.length) * 100) : 0 }
}

/** Features for a given backbone column (module) × release cell. */
export function cellFeatures(moduleId: string, releaseId: string, features: Feature[]): Feature[] {
  return features.filter((f) => f.moduleId === moduleId && f.releaseId === releaseId)
}

export function moduleById(id: string, data: WorkspaceData): Module | undefined {
  return data.modules.find((m) => m.id === id)
}

export function releaseById(id: string, data: WorkspaceData): Release | undefined {
  return data.releases.find((r) => r.id === id)
}

// ── Role filter helpers ─────────────────────────────────────────────────────

/** Whether a module is visible under the active role filter. */
export function moduleMatchesRole(module: Module, role: Role | null): boolean {
  return !role || module.owners.includes(role)
}

/** Whether a swimlane is visible under the active role filter. */
export function laneMatchesRole(lane: SwimLane, role: Role | null): boolean {
  return !role || lane.owners.includes(role)
}
