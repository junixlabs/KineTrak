import { applyCommand, type Command } from '../../src/shared/board'
import type { Project } from '../../src/shared/types'
import type { Store } from '../infra/store'

// ── Aggregate root: one project ───────────────────────────────────────────────
// Owns a project's full board state and is the only writer for it. Writes are
// serialized through an internal promise chain, so even with concurrent agents +
// humans the project mutates one command at a time (no lost updates in-process).
// Reuses the shared reducer unchanged via a single-project mini-root.

function applyBoardCommand(p: Project, cmd: Command): Project {
  const next = applyCommand({ orgs: [], projects: [p] }, cmd)
  return next.projects[0]
}

export class LoadedProject {
  /** Wall-clock of last access; the registry evicts idle aggregates. */
  lastAccess = Date.now()
  /** Pending writes — the registry won't evict while > 0. */
  inFlight = 0
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly store: Store,
    public project: Project,
  ) {}

  touch() {
    this.lastAccess = Date.now()
  }

  /**
   * Apply one board command, persist it, and resolve to the updated project.
   *
   * Invariants (the aggregate write contract):
   *  - serialized: each command runs after the previous one settles.
   *  - atomic per command: the in-RAM board only advances if the durable write
   *    succeeds; on failure it is rolled back to the pre-command state and the
   *    error is rethrown so the caller can surface it.
   *  - non-poisoning: a failed write never rejects the shared queue, so one
   *    transient DB error cannot brick all later commands for this project.
   */
  apply(cmd: Command): Promise<Project> {
    this.inFlight++
    this.touch()
    const run = this.queue.then(async () => {
      const prev = this.project
      const next = applyBoardCommand(prev, cmd)
      this.project = next
      try {
        await this.store.saveProject(next)
      } catch (e) {
        this.project = prev // roll back: never expose an unsaved mutation
        throw e
      }
      return next
    })
    // The next command chains off a settled tail (resolve OR reject swallowed),
    // so a rejection here is delivered to *this* caller only — not the queue.
    this.queue = run.then(
      () => {},
      () => {},
    )
    return run.finally(() => {
      this.inFlight--
    })
  }
}
