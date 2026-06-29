import type { Command, Root } from '../src/shared/board'
import type { User } from './auth'

// ── Per-user scoping of the shared board ─────────────────────────────────────
// A user sees only orgs they own and the projects inside them. Every mutating
// command is checked so a user can't touch another account's data.

export function userOwnsOrg(root: Root, userId: string, orgId: string): boolean {
  const org = root.orgs.find((o) => o.id === orgId)
  return !!org && org.ownerId === userId
}

function projectOrg(root: Root, projectId: string): string | undefined {
  return root.projects.find((p) => p.id === projectId)?.orgId
}

/** A board view containing only the user's orgs + their projects. */
export function scopeRootForUser(root: Root, userId: string): Root {
  const orgs = root.orgs.filter((o) => o.ownerId === userId)
  const ownIds = new Set(orgs.map((o) => o.id))
  return { orgs, projects: root.projects.filter((p) => ownIds.has(p.orgId)) }
}

/**
 * Authorize a command against a user. Returns the command to apply (possibly
 * stamped with ownerId), or throws if the user may not perform it.
 */
export function authorizeCommand(root: Root, user: User, cmd: Command): Command {
  const deny = () => {
    throw new Error('forbidden: command targets data outside your account')
  }
  switch (cmd.type) {
    // Creating an org is always allowed — stamp the owner from the session.
    case 'createOrg':
      return { ...cmd, ownerId: user.id }

    case 'renameOrg':
    case 'deleteOrg':
      if (!userOwnsOrg(root, user.id, cmd.id)) deny()
      return cmd

    case 'createProject':
    case 'importProject':
      if (!userOwnsOrg(root, user.id, cmd.orgId)) deny()
      return cmd

    case 'renameProject':
    case 'deleteProject': {
      const org = projectOrg(root, cmd.id)
      if (!org || !userOwnsOrg(root, user.id, org)) deny()
      return cmd
    }

    default: {
      // All remaining commands carry a projectId scoped to a single project.
      const pid = (cmd as { projectId?: string }).projectId
      if (!pid) deny()
      const org = projectOrg(root, pid as string)
      if (!org || !userOwnsOrg(root, user.id, org)) deny()
      return cmd
    }
  }
}
