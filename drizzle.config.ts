import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/infra/schema.ts',
  out: './server/infra/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://kinetrak:kinetrak@localhost:5432/kinetrak',
  },
})
