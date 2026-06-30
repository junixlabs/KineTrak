import pg from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

// ── Postgres connection (required) ───────────────────────────────────────────
// As of Phase 5 KineTrak persists exclusively to Postgres — set DATABASE_URL.
// (The browser still has its own local-only mode when no server is reachable;
// that is unrelated to server storage.)

export type DB = NodePgDatabase<typeof schema>

let pool: pg.Pool | null = null
let db: DB | null = null

/** Fail fast at boot if Postgres isn't configured. */
export function assertDatabaseConfigured(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error('KineTrak requires Postgres — set DATABASE_URL (e.g. postgres://user:pass@host:5432/kinetrak).')
  }
}

/** The drizzle client (constructed on first use). */
export function getDb(): DB {
  if (!db) {
    assertDatabaseConfigured()
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    db = drizzle(pool, { schema })
  }
  return db
}

/** Alias kept for repository call sites. */
export const requireDb = getDb

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    db = null
  }
}

export { schema }
