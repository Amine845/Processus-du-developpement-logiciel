import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
// Chargement explicite : Prisma peut chercher le .env à la racine du package.
const envFile = fileURLToPath(new URL('../src/server/.env', import.meta.url))
if (existsSync(envFile)) loadEnvFile(envFile)
// Les variables déjà exportées gardent la priorité ; SQLite est relatif au schéma.
const result = spawnSync(
  process.execPath,
  [require.resolve('prisma/build/index.js'), ...process.argv.slice(2)],
  {
    cwd: fileURLToPath(new URL('../src/server/', import.meta.url)),
    stdio: 'inherit',
  },
)
if (result.error) throw result.error
process.exit(result.status ?? 1)
