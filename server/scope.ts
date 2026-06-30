import type { Command } from '../src/shared/board'
import type { User } from './auth'
import { getCatalog } from './state'
import type { Catalog } from './infra/store'

// ── Per-user scoping over the resident catalog ───────────────────────────────
// A user sees only orgs they own and the projects inside them. Every mutating
// command is checked against the catalog (orgs + project headers) so a user can't
// touch another account's data. No board payload is needed for these checks.
//
// The functions take the catalog as a parameter (defaulting to the live one) so
// the authorization boundary is a pure function — unit-testable without a DB.

export function userOwnsOrg(userId: string, orgId: string, catalog: Catalog = getCatalog()): boolean {
  const org = catalog.orgs.find((o) => o.id === orgId)
  return !!org && org.ownerId === userId
}

function projectOrg(projectId: string, catalog: Catalog): string | undefined {
  return catalog.headers.find((h) => h.id === projectId)?.orgId
}

/**
 * Authorize a command against a user. Returns the command to apply (possibly
 * stamped with ownerId), or throws if the user may not perform it.
 */
export function authorizeCommand(user: User, cmd: Command, catalog: Catalog = getCatalog()): Command {
  const deny = () => {
    throw new Error('forbidden: command targets data outside your account')
  }
  switch (cmd.type) {
    // Creating an org is always allowed — stamp the owner from the session.
    case 'createOrg':
      return { ...cmd, ownerId: user.id }

    case 'renameOrg':
    case 'deleteOrg':
      if (!userOwnsOrg(user.id, cmd.id, catalog)) deny()
      return cmd

    case 'createProject':
    case 'importProject':
      if (!userOwnsOrg(user.id, cmd.orgId, catalog)) deny()
      return cmd

    case 'renameProject':
    case 'deleteProject': {
      const org = projectOrg(cmd.id, catalog)
      if (!org || !userOwnsOrg(user.id, org, catalog)) deny()
      return cmd
    }

    default: {
      // All remaining commands carry a projectId scoped to a single project.
      const pid = (cmd as { projectId?: string }).projectId
      if (!pid) deny()
      const org = projectOrg(pid as string, catalog)
      if (!org || !userOwnsOrg(user.id, org, catalog)) deny()
      return cmd
    }
  }
}
