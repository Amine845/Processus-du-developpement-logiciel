import { InvalidImageError, type PhotoStorage } from './domain/photo-storage.js'
import { createPhotoStorage } from './infrastructure/photo-storage.js'
import { createPrismaRecipeEquipmentRepository } from './infrastructure/prisma-recipe-equipment-repository.js'
import {
  RecipeEquipmentReadError,
  RecipeEquipmentWriteError,
  type RecipeEquipmentRepository,
} from './domain/recipe-equipment-repository.js'
import {
  EquipmentValidationError,
  parseEquipmentId,
  parseAssignEquipmentBody,
} from './application/recipe-equipment.js'
import { createPrismaRecipeTagRepository } from './infrastructure/prisma-recipe-tag-repository.js'
import {
  RecipeTagReadError,
  RecipeTagWriteError,
  type RecipeTagRepository,
} from './domain/recipe-tag-repository.js'
import { createServer, type IncomingMessage } from 'node:http'
import {
  RecipeConflictError,
  RecipeAssociationError,
  type RecipeRepository,
} from './domain/recipe-repository.js'
import { createRecipes } from './application/recipes.js'
import { RecipeValidationError } from './application/recipe-input.js'
import { createPersistence } from './infrastructure/prisma.js'
import { createPrismaRecipeRepository } from './infrastructure/prisma-recipe-repository.js'
import { createPrismaCiqualRepository } from './infrastructure/prisma-ciqual-repository.js'
import { createPrismaTagRepository } from './infrastructure/prisma-tag-repository.js'
import {
  TagReadError,
  TagWriteError,
  type IngredientTagRepository,
} from './domain/tag-repository.js'
import {
  TagValidationError,
  createIngredientTags,
  parseTagId,
  parseAssignBody,
} from './application/ingredient-tags.js'
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
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
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

/**
 * Les référentiels CIQUAL et de tags sont facultatifs :
 * sans eux, /api/ciqual, /api/tags et /api/ingredients répondent 404.
 */
export function createRecipeServer(
  repository: RecipeRepository,
  ciqualRepository?: CiqualRepository,
  photos?: PhotoStorage,
  tagRepository?: IngredientTagRepository,
  recipeTagRepository?: RecipeTagRepository,
  equipmentRepository?: RecipeEquipmentRepository,
) {
  const recipes = createRecipes(repository, photos)
  const ciqual = ciqualRepository ? createCiqual(ciqualRepository) : undefined
  const tags = tagRepository ? createIngredientTags(tagRepository) : undefined
  return createServer(async (request, response) => {
    const method = request.method ?? 'GET'
    // Vite development and the packaged Electron file renderer.
    const origin = request.headers.origin
    if (
      origin &&
      (origin === 'null' ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
    ) {
      response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader('Vary', 'Origin')
      if (method === 'OPTIONS') {
        response.writeHead(204, {
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        })
        response.end()
        return
      }
    }
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
      if (path.startsWith('/api/ciqual/') || path.startsWith('/api/recipes'))
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

      if (tags && path === '/api/tags') {
        if (method !== 'GET') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' })
          return
        }
        send(200, await tags.listTags())
        return
      }

      if (tags && path === '/api/ingredients') {
        if (method !== 'GET') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' })
          return
        }
        send(200, await tags.listIngredients())
        return
      }

      const ingredientMatch = /^\/api\/ingredients\/(\d+)$/.exec(path)
      if (tags && ingredientMatch) {
        const id = Number(ingredientMatch[1])
        if (!isValidId(id)) {
          send(400, { error: 'INVALID_INGREDIENT_ID' })
          return
        }
        if (method !== 'GET') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' })
          return
        }
        const ingredient = await tags.findIngredient(id)
        send(
          ingredient ? 200 : 404,
          ingredient ?? { error: 'INGREDIENT_NOT_FOUND' },
        )
        return
      }

      const assignMatch = /^\/api\/ingredients\/(\d+)\/tags$/.exec(path)
      if (tags && assignMatch) {
        const id = Number(assignMatch[1])
        if (!isValidId(id)) {
          send(400, { error: 'INVALID_INGREDIENT_ID' })
          return
        }
        if (method !== 'POST') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'POST' })
          return
        }
        const outcome = await tags.assign(id, await readJsonBody(request))
        if (outcome.kind === 'created' || outcome.kind === 'exists') {
          send(outcome.kind === 'created' ? 201 : 200, outcome.ingredient)
        } else if (outcome.kind === 'tag_inactive') {
          send(409, { error: 'TAG_INACTIVE' })
        } else {
          send(404, {
            error:
              outcome.kind === 'tag_not_found'
                ? 'TAG_NOT_FOUND'
                : 'INGREDIENT_NOT_FOUND',
          })
        }
        return
      }

      const removeMatch = /^\/api\/ingredients\/(\d+)\/tags\/(\d+)$/.exec(path)
      if (tags && removeMatch) {
        const id = Number(removeMatch[1])
        if (!isValidId(id)) {
          send(400, { error: 'INVALID_INGREDIENT_ID' })
          return
        }
        if (method !== 'DELETE') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'DELETE' })
          return
        }
        const outcome = await tags.remove(
          id,
          parseTagId(Number(removeMatch[2])),
        )
        if (outcome.kind === 'removed') send(204)
        else {
          send(404, {
            error:
              outcome.kind === 'absent'
                ? 'TAG_NOT_ASSIGNED'
                : 'INGREDIENT_NOT_FOUND',
          })
        }
        return
      }

      if (recipeTagRepository && path === '/api/recipe-tags') {
        if (method !== 'GET') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' })
          return
        }
        send(200, await recipeTagRepository.listTags())
        return
      }

      const recipeAssignMatch = /^\/api\/recipes\/(\d+)\/tags$/.exec(path)
      if (recipeTagRepository && recipeAssignMatch) {
        const id = Number(recipeAssignMatch[1])
        if (!isValidId(id)) {
          send(400, { error: 'INVALID_RECIPE_ID' })
          return
        }
        if (method !== 'POST') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'POST' })
          return
        }
        const outcome = await recipeTagRepository.assign(
          id,
          parseAssignBody(await readJsonBody(request)),
        )
        if (outcome.kind === 'created' || outcome.kind === 'exists') {
          const recipe = await repository.findById(id)
          send(
            recipe ? (outcome.kind === 'created' ? 201 : 200) : 404,
            recipe ?? { error: 'RECIPE_NOT_FOUND' },
          )
        } else if (outcome.kind === 'tag_inactive') {
          send(409, { error: 'TAG_INACTIVE' })
        } else {
          send(404, {
            error:
              outcome.kind === 'tag_not_found'
                ? 'TAG_NOT_FOUND'
                : 'RECIPE_NOT_FOUND',
          })
        }
        return
      }

      const recipeRemoveMatch = /^\/api\/recipes\/(\d+)\/tags\/(\d+)$/.exec(
        path,
      )
      if (recipeTagRepository && recipeRemoveMatch) {
        const id = Number(recipeRemoveMatch[1])
        if (!isValidId(id)) {
          send(400, { error: 'INVALID_RECIPE_ID' })
          return
        }
        if (method !== 'DELETE') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'DELETE' })
          return
        }
        const outcome = await recipeTagRepository.remove(
          id,
          parseTagId(Number(recipeRemoveMatch[2])),
        )
        if (outcome.kind === 'removed') send(204)
        else {
          send(404, {
            error:
              outcome.kind === 'absent'
                ? 'TAG_NOT_ASSIGNED'
                : 'RECIPE_NOT_FOUND',
          })
        }
        return
      }

      if (equipmentRepository && path === '/api/equipment') {
        if (method !== 'GET') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' })
          return
        }
        send(200, await equipmentRepository.listEquipment())
        return
      }

      const equipmentAssignMatch = /^\/api\/recipes\/(\d+)\/equipment$/.exec(
        path,
      )
      if (equipmentRepository && equipmentAssignMatch) {
        const id = Number(equipmentAssignMatch[1])
        if (!isValidId(id)) {
          send(400, { error: 'INVALID_RECIPE_ID' })
          return
        }
        if (method !== 'POST') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'POST' })
          return
        }
        const outcome = await equipmentRepository.assign(
          id,
          parseAssignEquipmentBody(await readJsonBody(request)),
        )
        if (outcome.kind === 'created' || outcome.kind === 'exists') {
          const recipe = await repository.findById(id)
          send(
            recipe ? (outcome.kind === 'created' ? 201 : 200) : 404,
            recipe ?? { error: 'RECIPE_NOT_FOUND' },
          )
        } else if (outcome.kind === 'equipment_inactive') {
          send(409, { error: 'EQUIPMENT_INACTIVE' })
        } else {
          send(404, {
            error:
              outcome.kind === 'equipment_not_found'
                ? 'EQUIPMENT_NOT_FOUND'
                : 'RECIPE_NOT_FOUND',
          })
        }
        return
      }

      const equipmentRemoveMatch =
        /^\/api\/recipes\/(\d+)\/equipment\/(\d+)$/.exec(path)
      if (equipmentRepository && equipmentRemoveMatch) {
        const id = Number(equipmentRemoveMatch[1])
        if (!isValidId(id)) {
          send(400, { error: 'INVALID_RECIPE_ID' })
          return
        }
        if (method !== 'DELETE') {
          send(405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'DELETE' })
          return
        }
        const outcome = await equipmentRepository.remove(
          id,
          parseEquipmentId(Number(equipmentRemoveMatch[2])),
        )
        if (outcome.kind === 'removed') send(204)
        else {
          send(404, {
            error:
              outcome.kind === 'absent'
                ? 'EQUIPMENT_NOT_ASSIGNED'
                : 'RECIPE_NOT_FOUND',
          })
        }
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
      } else if (error instanceof EquipmentValidationError) {
        send(400, { error: 'INVALID_EQUIPMENT', issues: error.issues })
      } else if (error instanceof RecipeEquipmentReadError) {
        send(503, { error: 'EQUIPMENT_READ_FAILED' })
      } else if (error instanceof RecipeEquipmentWriteError) {
        send(503, { error: 'EQUIPMENT_WRITE_FAILED' })
      } else if (error instanceof TagValidationError) {
        send(400, { error: 'INVALID_TAG', issues: error.issues })
      } else if (
        error instanceof TagReadError ||
        error instanceof RecipeTagReadError
      ) {
        send(503, { error: 'TAG_READ_FAILED' })
      } else if (
        error instanceof TagWriteError ||
        error instanceof RecipeTagWriteError
      ) {
        send(503, { error: 'TAG_WRITE_FAILED' })
      } else if (error instanceof InvalidImageError) {
        send(400, { error: 'INVALID_IMAGE' })
      } else if (error instanceof RecipeValidationError) {
        send(400, { error: 'INVALID_RECIPE', issues: error.issues })
      } else if (error instanceof RecipeAssociationError) {
        send(400, { error: error.code, ciqualCode: error.ciqualCode })
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
    createPrismaTagRepository(persistence.client),
    createPrismaRecipeTagRepository(persistence.client),
    createPrismaRecipeEquipmentRepository(persistence.client),
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
