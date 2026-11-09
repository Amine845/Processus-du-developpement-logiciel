import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { syncEquipmentVocabulary } from '../dist-server/server/infrastructure/equipment-vocabulary-sync.js'

// Synchronise le vocabulaire de tags sans toucher aux recettes ni aux ingrédients.
const envFile = fileURLToPath(new URL('../src/server/.env', import.meta.url))
if (existsSync(envFile)) loadEnvFile(envFile)

let prisma
try {
  if (!process.env.DATABASE_URL?.startsWith('file:')) {
    throw new Error('Configurer une DATABASE_URL SQLite dans src/server/.env.')
  }
  prisma = new PrismaClient()
  const report = await prisma.$transaction((tx) => syncEquipmentVocabulary(tx))
  console.log('Équipements synchronisés :', JSON.stringify(report))
} catch (error) {
  console.error('Échec de la synchronisation des équipements :', error)
  process.exitCode = 1
} finally {
  await prisma?.$disconnect()
}
