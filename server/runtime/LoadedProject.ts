import { applyCommand, type Command } from '../../src/shared/board'
import type { Project } from '../../src/store/types'
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

  /** Apply one board command, persist, and resolve to the updated project. */
  apply(cmd: Command): Promise<Project> {
    this.inFlight++
    this.touch()
    this.queue = this.queue.then(async () => {
      this.project = applyBoardCommand(this.project, cmd)
      await this.store.saveProject(this.project)
    })
    const done = this.queue
    return done
      .then(() => this.project)
      .finally(() => {
        this.inFlight--
      })
  }
}
