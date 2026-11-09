import { createServer, type IncomingMessage } from 'node:http'
import {
  RecipeConflictError,
  type RecipeRepository,
} from './domain/recipe-repository.js'
import { createRecipes } from './application/recipes.js'
import { RecipeValidationError } from './application/recipe-input.js'
import { InvalidImageError, type PhotoStorage } from './domain/photo-storage.js'
import { createPhotoStorage } from './infrastructure/photo-storage.js'
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


const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const MAX_BODY_BYTES = 100 * 1024
const isValidId = (id: number) =>
  Number.isInteger(id) && id >= 1 && id <= 2147483647

class HttpError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string) {
    super(code)
    this.status = status
    this.code = code
  }
}

function readBody(
  request: IncomingMessage,
  { maxBytes, contentType }: { maxBytes: number; contentType: RegExp },
): Promise<Buffer> {
  if (!contentType.test(request.headers['content-type'] ?? '')) {
    return Promise.reject(new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE'))
  }
  if (Number(request.headers['content-length']) > maxBytes) {
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
      if (size > maxBytes) return fail(new HttpError(413, 'PAYLOAD_TOO_LARGE'))
      chunks.push(chunk)
    })
    request.on('end', () => {
      if (settled) return
      settled = true
      resolve(Buffer.concat(chunks))
    })
    request.on('error', () => fail(new HttpError(400, 'INVALID_BODY')))
  })
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const body = await readBody(request, {
    maxBytes: MAX_BODY_BYTES,
    contentType: /^application\/json\s*(;|$)/i,
  })
  try {
    return JSON.parse(body.toString('utf8'))
  } catch {
    throw new HttpError(400, 'INVALID_JSON')
  }
}

/** Le référentiel CIQUAL est facultatif : sans lui, /api/ciqual répond 404. */
export function createRecipeServer(
  repository: RecipeRepository,
  ciqualRepository?: CiqualRepository,
  photos?: PhotoStorage,
) {
  const recipes = createRecipes(repository, photos)
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

      const photoGet = /^\/api\/photos\/([0-9a-f]{32})\.webp$/.exec(path)
      if (photos && photoGet) {
        if (method !== 'GET') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' })
          return
        }
        const data = await photos.read(photoGet[1])
        if (!data) {
          send(404, { error: 'PHOTO_NOT_FOUND' })
          return
        }
        response.writeHead(200, {
          'Content-Type': 'image/webp',
          'Content-Length': data.length,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        })
        response.end(data)
        return
      }

      const photoPut = /^\/api\/recipes\/(\d+)\/photo$/.exec(path)
      if (photos && photoPut) {
        const id = Number(photoPut[1])
        if (!isValidId(id)) {
          send(400, { error: 'INVALID_RECIPE_ID' })
          return
        }
        if (method !== 'PUT') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'PUT' })
          return
        }
        const raw = await readBody(request, {
          maxBytes: MAX_PHOTO_BYTES,
          contentType: /^image\/(jpeg|png|webp)\s*(;|$)/i,
        })
        const photoId = await recipes.setPhoto(id, raw)
        if (photoId === undefined) send(404, { error: 'RECIPE_NOT_FOUND' })
        else send(200, { photoId })
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
      } else if (error instanceof InvalidImageError) {
        send(400, { error: 'INVALID_IMAGE' })
      } else {
        console.error(`[${method} ${request.url}] erreur non gérée :`, error)
        send(503, {
          error:
            method === 'GET' ? 'RECIPE_READ_FAILED' : 'RECIPE_WRITE_FAILED',
        })
      }
    }
  })
}

export async function startServer(
  databaseUrl: string,
  port = 3001,
  photosDir = process.env.PHOTOS_DIR ?? 'uploads/recipes',
) {
  const persistence = createPersistence(databaseUrl)
  const server = createRecipeServer(
    createPrismaRecipeRepository(persistence.client),
    createPrismaCiqualRepository(persistence.client),
    createPhotoStorage(photosDir),
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
