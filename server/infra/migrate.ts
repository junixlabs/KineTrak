import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { getDb } from './db'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Apply pending SQL migrations. */
export async function runMigrations(): Promise<void> {
  await migrate(getDb(), { migrationsFolder: join(HERE, 'migrations') })
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
