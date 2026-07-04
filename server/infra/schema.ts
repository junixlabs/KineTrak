import { bigserial, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import type { OrgBoardEdge, OrgBoardNode, Snapshot, WorkspaceData } from '../../src/store/types'
import type { Actor } from '../activity'

// ── Drizzle schema — the durable store behind KineTrak ───────────────────────
// Catalog (users/sessions/orgs/projects/api_keys/shares) is relational; the board
// itself lives as a JSONB document on `projects.data` (+ snapshots). Activity is an
// append-only log. Foreign keys cascade so deleting an org/project cleans up keys,
// shares, sessions and activity for free (replacing the hand-rolled cleanup).

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  salt: text('salt').notNull(),
  hash: text('hash').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable(
  'sessions',
  {
    token: text('token').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
)

export const orgs = pgTable(
  'orgs',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [index('orgs_owner_idx').on(t.ownerId)],
)

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    data: jsonb('data').$type<WorkspaceData>().notNull(),
    snapshots: jsonb('snapshots').$type<Snapshot[]>().notNull().default([]),
    schemaVersion: integer('schema_version').notNull().default(1),
    // Optimistic-concurrency guard — bumped on every write (used once writes go
    // multi-process; single-process is already serialized by the registry).
    version: integer('version').notNull().default(0),
  },
  (t) => [index('projects_org_idx').on(t.orgId)],
)

// Org-level system maps (how the org's projects work together). Small documents,
// kept resident on the server like the catalog; nodes/edges live as JSONB.
export const orgBoards = pgTable(
  'org_boards',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    nodes: jsonb('nodes').$type<OrgBoardNode[]>().notNull().default([]),
    edges: jsonb('edges').$type<OrgBoardEdge[]>().notNull().default([]),
    version: integer('version').notNull().default(0),
  },
  (t) => [index('org_boards_org_idx').on(t.orgId)],
)

export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: text('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // Keys are hashed at rest (sha-256). `keyPrefix` is the shown-once non-secret
    // label (e.g. "kt_live_ab12…") so the UI can identify a key without the secret.
    keyHash: text('key_hash').notNull().unique(),
    keyPrefix: text('key_prefix').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  },
  (t) => [index('api_keys_user_idx').on(t.userId)],
)

export const shares = pgTable(
  'shares',
  {
    token: text('token').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (t) => [index('shares_project_idx').on(t.projectId)],
)

// Public read-only links for org boards — parallel to `shares` (one token per
// board). A polymorphic shares.project_id would fork every call site (WS auth,
// /api/shared, pruneShares) for ~50 lines of savings; a twin table keeps both paths simple.
export const orgBoardShares = pgTable(
  'org_board_shares',
  {
    token: text('token').primaryKey(),
    orgBoardId: text('org_board_id')
      .notNull()
      .references(() => orgBoards.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('org_board_shares_board_idx').on(t.orgBoardId)],
)

export const activity = pgTable(
  'activity',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
    actor: jsonb('actor').$type<Actor>().notNull(),
    summary: text('summary').notNull(),
    targetId: text('target_id'),
    kind: text('kind', { enum: ['change', 'note'] }).notNull(),
  },
  // Cursor scan for get_changes_since: WHERE project_id=$ AND id > $cursor.
  (t) => [index('activity_project_id_idx').on(t.projectId, t.id)],
)

// Read projection (CQRS) — one searchable row per module/feature/swimnode.
// Rebuilt on each project save so `search` runs over the org's rows without
// loading any board into memory. `text` is the concatenated searchable blob.
export const searchItems = pgTable(
  'search_items',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['module', 'feature', 'swimnode'] }).notNull(),
    itemId: text('item_id').notNull(),
    label: text('label').notNull(),
    text: text('text').notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.kind, t.itemId] }), index('search_items_project_idx').on(t.projectId)],
)
