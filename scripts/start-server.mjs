import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

const envFile = fileURLToPath(new URL('../src/server/.env', import.meta.url))
if (existsSync(envFile)) loadEnvFile(envFile)
const require = createRequire(import.meta.url)
const serverArgs = process.argv.includes('--dev')
  ? [require.resolve('tsx/cli'), 'src/server/index.ts']
  : ['dist-server/server/main.js']
const child = spawn(process.execPath, serverArgs, {
  stdio: 'inherit',
})
const updater =
  process.env.CIQUAL_AUTO_UPDATE === '0'
    ? undefined
    : spawn(process.execPath, ['scripts/ciqual-sync.mjs', '--watch'], {
        stdio: 'inherit',
      })
updater?.on('error', (error) =>
  console.error(`CIQUAL updater: ${error.message}`),
)
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal)
    updater?.kill(signal)
  })
}
child.on('error', () => {
  process.exitCode = 1
})
child.on('exit', (code) => {
  updater?.kill('SIGTERM')
  process.exitCode = code ?? 1
})
