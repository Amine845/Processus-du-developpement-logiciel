import { PrismaClient } from '@prisma/client'

/** One owner per server runtime; tests supply their own isolated URL. */
export function createPersistence(databaseUrl: string) {
  if (!databaseUrl.startsWith('file:') || databaseUrl.length <= 5) {
    throw new Error('A SQLite DATABASE_URL is required')
  }
  const client = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: [],
  })
  let closing: Promise<void> | undefined
  return {
    client,
    connect: () => client.$connect(),
    close: () => (closing ??= client.$disconnect()),
  }
}
