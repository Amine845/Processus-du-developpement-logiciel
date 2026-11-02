import { createServer } from 'node:http'
import type { RecipeRepository } from './domain/recipe-repository.js'
import { createRecipes } from './application/recipes.js'
import { createPersistence } from './infrastructure/prisma.js'
import { createPrismaRecipeRepository } from './infrastructure/prisma-recipe-repository.js'

export function createRecipeServer(repository: RecipeRepository) {
  const recipes = createRecipes(repository)
  return createServer(async (request, response) => {
    const send = (status: number, body: unknown) => {
      response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
      })
      response.end(JSON.stringify(body))
    }
    try {
      const path = new URL(request.url ?? '/', 'http://localhost').pathname
      if (request.method === 'GET' && path === '/api/recipes') {
        send(200, await recipes.findAll())
        return
      }
      const match = /^\/api\/recipes\/(\d+)$/.exec(path)
      if (request.method === 'GET' && match) {
        const id = Number(match[1])
        if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
          send(400, { error: 'INVALID_RECIPE_ID' })
          return
        }
        const recipe = await recipes.findById(id)
        send(recipe ? 200 : 404, recipe ?? { error: 'RECIPE_NOT_FOUND' })
        return
      }
      send(404, { error: 'NOT_FOUND' })
    } catch {
      send(503, { error: 'RECIPE_READ_FAILED' })
    }
  })
}

export async function startServer(databaseUrl: string, port = 3001) {
  const persistence = createPersistence(databaseUrl)
  const server = createRecipeServer(
    createPrismaRecipeRepository(persistence.client),
  )
  try {
    await persistence.connect()
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, '127.0.0.1', () => {
        server.off('error', reject)
        resolve()
      })
    })
  } catch {
    await persistence.close()
    throw new Error('Unable to start recipe server')
  }
  let closing: Promise<void> | undefined
  const close = () => {
    closing ??= (async () => {
      // Stop accepting requests, finish active ones, then disconnect Prisma.
      try {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
          server.closeIdleConnections()
        })
      } finally {
        await persistence.close()
      }
    })()
    return closing
  }
  return { server, close }
}
