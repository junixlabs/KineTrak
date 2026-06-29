import pg from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

// ── Postgres connection (opt-in) ─────────────────────────────────────────────
// KineTrak uses Postgres when DATABASE_URL is set; otherwise it falls back to the
// original file-JSON store (local-first / zero-dependency). One pool per process.

export type DB = NodePgDatabase<typeof schema>

let pool: pg.Pool | null = null
let db: DB | null = null

export function isPgEnabled(): boolean {
  return !!process.env.DATABASE_URL
}

/** The drizzle client, or null when running in file-JSON mode. */
export function getDb(): DB | null {
  if (!isPgEnabled()) return null
  if (!db) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    db = drizzle(pool, { schema })
  }
  return db
}

/** Throwing accessor for code paths that only run when Postgres is enabled. */
export function requireDb(): DB {
  const d = getDb()
  if (!d) throw new Error('Postgres is not enabled (DATABASE_URL unset)')
  return d
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    db = null
  }
}

export { schema }
