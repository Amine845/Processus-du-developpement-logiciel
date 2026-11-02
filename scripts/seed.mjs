import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { seedDatabase } from '../dist-server/server/prisma/seed.js'

const envFile = fileURLToPath(new URL('../src/server/.env', import.meta.url))
if (existsSync(envFile)) loadEnvFile(envFile)

let prisma
try {
  if (!process.env.DATABASE_URL?.startsWith('file:')) {
    throw new Error('Configurer une DATABASE_URL SQLite dans src/server/.env.')
  }
  prisma = new PrismaClient()
  await seedDatabase(prisma)
  console.log(
    'Seed terminé : 3 recettes, 6 ingrédients, 11 lignes et 11 étapes de démonstration.',
  )
} catch (error) {
  console.error('Échec du seed :', error)
  process.exitCode = 1
} finally {
  await prisma?.$disconnect()
}
