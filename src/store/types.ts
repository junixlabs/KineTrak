// cm:guard client-only state shapes — the board domain model lives in src/shared/types.ts.
// A domain type added here re-creates the shared -> store edge that .arch.json locks against.

/** Initial selection when opening an org board from elsewhere (alert, feature panel). */
export type OrgBoardSel = { type: 'node'; id: string } | { type: 'edge'; from: string; to: string }

/** Authenticated account (server mode). Never carries the password hash.
 *  Deliberately client-side: server/auth.ts owns its own richer User (salt/hash),
 *  and promoting this one to shared would set up a competing account type. */
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

// cm:edge contract -> src/shared/types.ts — Selection is defined there because the
// persisted AlertAction embeds it; re-exported here so the view layer keeps one name.
export type { Selection } from '../shared/types'
