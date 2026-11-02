import { startServer } from './server.js'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required')

  const port = Number(process.env.PORT ?? 3001)
  const { close } = await startServer(databaseUrl, port)

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => void close().then(() => process.exit(0)))
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
