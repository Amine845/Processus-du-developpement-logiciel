import { startServer } from './server.js'

async function main() {
  const port = Number(process.env.PORT ?? 3001)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid PORT')
  }
  const runtime = await startServer(process.env.DATABASE_URL ?? '', port)
  const shutdown = () => {
    void runtime.close().then(
      () => {
        process.removeListener('SIGINT', shutdown)
        process.removeListener('SIGTERM', shutdown)
      },
      () => {
        console.error('Unable to stop recipe server')
        process.exitCode = 1
      },
    )
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  console.log(`Recipe server listening on http://127.0.0.1:${port}`)
}

void main().catch(() => {
  console.error('Unable to start recipe server; check server configuration')
  process.exitCode = 1
})
