import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashSecret } from './keys'
import { closeDb } from './infra/db'
import { runMigrations } from './infra/migrate'
import { activityRepo, keyRepo, orgRepo, projectRepo, sessionRepo, shareRepo, userRepo } from './infra/repositories'
import type { Snapshot, WorkspaceData } from '../src/store/types'
import type { Actor } from './activity'

// ── One-time importer: file-JSON store → Postgres ────────────────────────────
//   DATABASE_URL=... npm run db:import
// Idempotency: insert errors (duplicate ids) are logged and skipped, so a re-run
// only adds what is missing. Legacy plaintext API keys are hashed on import.

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA = join(HERE, 'data')

function readJson<T>(file: string, fallback: T): T {
  const p = join(DATA, file)
  if (!existsSync(p)) return fallback
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as T
  } catch {
    return fallback
  }
}

async function step(label: string, items: unknown[], fn: (x: never) => Promise<void>) {
  let ok = 0
  let skip = 0
  for (const it of items) {
    try {
      await fn(it as never)
      ok++
    } catch (e) {
      skip++
      console.warn(`  · skip ${label}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  console.log(`${label}: ${ok} imported, ${skip} skipped`)
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL to import into Postgres.')
    process.exit(1)
  }
  await runMigrations()

  const users = readJson<Record<string, unknown>[]>('users.json', [])
  const sessions = readJson<Record<string, unknown>[]>('sessions.json', [])
  const board = readJson<{ orgs: Record<string, unknown>[]; projects: Record<string, unknown>[] }>('board.json', { orgs: [], projects: [] })
  const keys = readJson<Record<string, unknown>[]>('keys.json', [])
  const shares = readJson<Record<string, unknown>[]>('shares.json', [])
  const activity = readJson<Record<string, unknown>[]>('activity.json', [])

  // Order respects foreign keys: users → orgs → projects → (sessions/keys/shares/activity).
  await step('users', users, async (u: Record<string, unknown>) =>
    userRepo.insert({
      id: u.id as string,
      email: u.email as string,
      name: u.name as string,
      salt: u.salt as string,
      hash: u.hash as string,
      role: (u.role as 'admin' | 'user') ?? 'user',
      createdAt: (u.createdAt as string) ?? new Date().toISOString(),
    }),
  )

  await step('orgs', board.orgs, async (o: Record<string, unknown>) =>
    orgRepo.insert({ id: o.id as string, name: o.name as string, ownerId: o.ownerId as string }),
  )

  await step('projects', board.projects, async (p: Record<string, unknown>) =>
    projectRepo.save({
      id: p.id as string,
      orgId: p.orgId as string,
      name: p.name as string,
      createdAt: (p.createdAt as string) ?? new Date().toISOString(),
      data: p.data as WorkspaceData,
      snapshots: (p.snapshots as Snapshot[]) ?? [],
    }),
  )

  await step('sessions', sessions, async (s: Record<string, unknown>) =>
    sessionRepo.insert({ token: s.token as string, userId: s.userId as string, expiresAt: s.expiresAt as number }),
  )

  await step('keys', keys, async (k: Record<string, unknown>) => {
    const secret = (k.secret ?? k.key) as string | undefined
    if (!secret) throw new Error('key has no secret to hash')
    const { keyHash, keyPrefix } = hashSecret(secret)
    await keyRepo.insert({
      id: k.id as string,
      userId: k.userId as string,
      orgId: k.orgId as string,
      name: (k.name as string) ?? 'Agent key',
      keyHash,
      keyPrefix,
      createdAt: (k.createdAt as string) ?? new Date().toISOString(),
      lastUsedAt: (k.lastUsedAt as string | null) ?? null,
    })
  })

  await step('shares', shares, async (s: Record<string, unknown>) =>
    shareRepo.insert({ token: s.token as string, projectId: s.projectId as string, createdAt: (s.createdAt as string) ?? new Date().toISOString() }),
  )

  await step('activity', activity, async (a: Record<string, unknown>) =>
    activityRepo.insert({
      id: '0',
      projectId: a.projectId as string,
      ts: (a.ts as number) ?? Date.now(),
      actor: a.actor as Actor,
      summary: (a.summary as string) ?? '',
      targetId: a.targetId as string | undefined,
      kind: (a.kind as 'change' | 'note') ?? 'change',
    }),
  )

  await closeDb()
  console.log('import complete.')
}

main().catch((e) => {
  console.error('import failed:', e)
  process.exit(1)
})
