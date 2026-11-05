import { createServer, type IncomingMessage } from 'node:http'
import {
  RecipeConflictError,
  type RecipeRepository,
} from './domain/recipe-repository.js'
import { createRecipes } from './application/recipes.js'
import { RecipeValidationError } from './application/recipe-input.js'
import { createPersistence } from './infrastructure/prisma.js'
import { createPrismaRecipeRepository } from './infrastructure/prisma-recipe-repository.js'
import { createPrismaCiqualRepository } from './infrastructure/prisma-ciqual-repository.js'
import {
  CiqualReadError,
  type CiqualRepository,
} from './domain/ciqual-repository.js'
import { CiqualQueryError, createCiqual } from './application/ciqual.js'
import {
  CIQUAL_SEARCH_DEFAULT_LIMIT,
  CIQUAL_SEARCH_MAX_LIMIT,
  CIQUAL_SEARCH_MIN_LENGTH,
} from '../shared/types/ciqual.types.js'

const MAX_BODY_BYTES = 100 * 1024
const isValidId = (id: number) =>
  Number.isInteger(id) && id >= 1 && id <= 2147483647

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
  }
}

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  if (
    !/^application\/json\s*(;|$)/i.test(request.headers['content-type'] ?? '')
  ) {
    return Promise.reject(new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE'))
  }
  if (Number(request.headers['content-length']) > MAX_BODY_BYTES) {
    return Promise.reject(new HttpError(413, 'PAYLOAD_TOO_LARGE'))
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    let settled = false
    const fail = (error: HttpError) => {
      if (settled) return
      settled = true
      chunks.length = 0
      reject(error)
    }
    // After a failure we keep draining without storing, so the response can flush.
    request.on('data', (chunk: Buffer) => {
      if (settled) return
      size += chunk.length
      if (size > MAX_BODY_BYTES)
        return fail(new HttpError(413, 'PAYLOAD_TOO_LARGE'))
      chunks.push(chunk)
    })
    request.on('end', () => {
      if (settled) return
      settled = true
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new HttpError(400, 'INVALID_JSON'))
      }
    })
    request.on('error', () => fail(new HttpError(400, 'INVALID_BODY')))
  })
}

/** Le référentiel CIQUAL est facultatif : sans lui, /api/ciqual répond 404. */
export function createRecipeServer(
  repository: RecipeRepository,
  ciqualRepository?: CiqualRepository,
) {
  const recipes = createRecipes(repository)
  const ciqual = ciqualRepository ? createCiqual(ciqualRepository) : undefined
  return createServer(async (request, response) => {
    const method = request.method ?? 'GET'
    const send = (
      status: number,
      body?: unknown,
      headers: Record<string, string> = {},
    ) => {
      if (body === undefined) {
        response.writeHead(status, headers)
        response.end()
        return
      }
      response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        ...headers,
      })
      response.end(JSON.stringify(body))
    }
    try {
      const url = new URL(request.url ?? '/', 'http://localhost')
      const path = url.pathname
      if (path.startsWith('/api/ciqual/'))
        response.setHeader('Cache-Control', 'no-store')

      if (ciqual && path === '/api/ciqual/foods') {
        if (method !== 'GET') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' })
          return
        }
        send(
          200,
          await ciqual.search(
            url.searchParams.get('q'),
            url.searchParams.get('limit'),
            url.searchParams.has('category')
              ? url.searchParams.getAll('category').length === 1
                ? url.searchParams.get('category')
                : []
              : undefined,
          ),
        )
        return
      }

      const foodMatch = /^\/api\/ciqual\/foods\/([^/]+)$/.exec(path)
      if (ciqual && foodMatch) {
        if (method !== 'GET') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' })
          return
        }
        const food = await ciqual.findByCode(foodMatch[1])
        send(food ? 200 : 404, food ?? { error: 'CIQUAL_FOOD_NOT_FOUND' })
        return
      }

      if (path === '/api/recipes') {
        if (method === 'GET') {
          send(200, await recipes.findAll())
        } else if (method === 'POST') {
          const created = await recipes.create(await readJsonBody(request))
          send(201, created, { Location: `/api/recipes/${created.id}` })
        } else {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET, POST' })
        }
        return
      }

      const match = /^\/api\/recipes\/(\d+)$/.exec(path)
      if (match) {
        const id = Number(match[1])
        if (!isValidId(id)) {
          send(400, { error: 'INVALID_RECIPE_ID' })
          return
        }
        if (method === 'GET') {
          const recipe = await recipes.findById(id)
          send(recipe ? 200 : 404, recipe ?? { error: 'RECIPE_NOT_FOUND' })
        } else if (method === 'PUT') {
          const updated = await recipes.update(id, await readJsonBody(request))
          send(updated ? 200 : 404, updated ?? { error: 'RECIPE_NOT_FOUND' })
        } else if (method === 'DELETE') {
          if (await recipes.deleteById(id)) send(204)
          else send(404, { error: 'RECIPE_NOT_FOUND' })
        } else {
          send(
            405,
            { error: 'METHOD_NOT_ALLOWED' },
            { Allow: 'GET, PUT, DELETE' },
          )
        }
        return
      }

      send(404, { error: 'NOT_FOUND' })
    } catch (error) {
      if (error instanceof HttpError) {
        send(
          error.status,
          { error: error.code },
          error.status === 413 ? { Connection: 'close' } : {},
        )
      } else if (error instanceof CiqualQueryError) {
        send(400, {
          error: error.code,
          minLength: CIQUAL_SEARCH_MIN_LENGTH,
          defaultLimit: CIQUAL_SEARCH_DEFAULT_LIMIT,
          maxLimit: CIQUAL_SEARCH_MAX_LIMIT,
        })
      } else if (error instanceof CiqualReadError) {
        send(503, { error: 'CIQUAL_READ_FAILED' })
      } else if (error instanceof RecipeValidationError) {
        send(400, { error: 'INVALID_RECIPE', issues: error.issues })
      } else if (error instanceof RecipeConflictError) {
        send(409, { error: 'RECIPE_TITLE_CONFLICT' })
      } else {
        send(503, {
          error:
            method === 'GET' ? 'RECIPE_READ_FAILED' : 'RECIPE_WRITE_FAILED',
        })
      }
    }
  })
}

export async function startServer(databaseUrl: string, port = 3001) {
  const persistence = createPersistence(databaseUrl)
  const server = createRecipeServer(
    createPrismaRecipeRepository(persistence.client),
    createPrismaCiqualRepository(persistence.client),
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
