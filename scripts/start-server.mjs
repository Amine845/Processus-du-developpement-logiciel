import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

const envFile = fileURLToPath(new URL('../src/server/.env', import.meta.url))
if (existsSync(envFile)) loadEnvFile(envFile)
const child = spawn(process.execPath, ['dist-server/main.js'], {
  stdio: 'inherit',
})
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}
child.on('error', () => {
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
