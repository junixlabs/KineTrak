import type { Project } from '../../src/store/types'
import type { Store } from '../infra/store'
import { LoadedProject } from './LoadedProject'

// ── Identity map + TTL eviction ───────────────────────────────────────────────
// At most one LoadedProject per id lives in this process (so writes serialize).
// Idle aggregates are evicted so memory tracks the active working set, not every
// project that ever existed. Concurrent acquires of the same id share one load.

const TTL_MS = 5 * 60 * 1000
const SWEEP_MS = 60 * 1000

export class ProjectRegistry {
  private live = new Map<string, LoadedProject>()
  private loading = new Map<string, Promise<LoadedProject | null>>()
  private sweeper: ReturnType<typeof setInterval>

  constructor(
    private readonly store: Store,
    private readonly ttlMs = TTL_MS,
  ) {
    this.sweeper = setInterval(() => this.sweep(), SWEEP_MS)
    this.sweeper.unref?.()
  }

  /** Get the live aggregate for a project, loading it on demand. null if absent. */
  async acquire(id: string): Promise<LoadedProject | null> {
    const cached = this.live.get(id)
    if (cached) {
      cached.touch()
      return cached
    }
    let pending = this.loading.get(id)
    if (!pending) {
      pending = this.store.loadProject(id).then((proj) => {
        this.loading.delete(id)
        if (!proj) return null
        const lp = new LoadedProject(this.store, proj)
        this.live.set(id, lp)
        return lp
      })
      this.loading.set(id, pending)
    }
    return pending
  }

  /** Register a freshly created project as live (skips a reload). */
  put(project: Project): LoadedProject {
    const lp = new LoadedProject(this.store, project)
    this.live.set(project.id, lp)
    return lp
  }

  evict(id: string) {
    this.live.delete(id)
  }

  /** Currently-resident project count (for tests / observability). */
  residentCount(): number {
    return this.live.size
  }

  /** Evict idle aggregates past the TTL. Runs on a timer; also callable for tests. */
  sweep() {
    const cutoff = Date.now() - this.ttlMs
    for (const [id, lp] of this.live) {
      if (lp.inFlight === 0 && lp.lastAccess < cutoff) this.live.delete(id)
    }
  }
}
