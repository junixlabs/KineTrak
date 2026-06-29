import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { getDb, isPgEnabled } from './db'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Apply pending SQL migrations. No-op in file-JSON mode. */
export async function runMigrations(): Promise<void> {
  if (!isPgEnabled()) return
  const db = getDb()!
  await migrate(db, { migrationsFolder: join(HERE, 'migrations') })
}

// Allow running standalone: `tsx server/infra/migrate.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('migrations applied')
      process.exit(0)
    })
    .catch((e) => {
      console.error('migration failed:', e)
      process.exit(1)
    })
}
