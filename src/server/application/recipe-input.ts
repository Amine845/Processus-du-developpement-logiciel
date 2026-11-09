import {
  RECIPE_UNITS,
  type RecipeUnit,
} from '../../shared/types/recipe.types.js'
import type { RecipeInput } from '../domain/recipe-repository.js'

export class RecipeValidationError extends Error {
  constructor(readonly issues: string[]) {
    super('Invalid recipe')
    this.name = 'RecipeValidationError'
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseRecipeInput(body: unknown): RecipeInput {
  if (!isRecord(body)) {
    throw new RecipeValidationError(['body must be a JSON object'])
  }
  const issues: string[] = []

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (title.length < 1 || title.length > 200) {
    issues.push('title: 1 to 200 characters required')
  }

  let description: string | null = null
  if (body.description !== undefined && body.description !== null) {
    if (
      typeof body.description !== 'string' ||
      body.description.length > 2000
    ) {
      issues.push('description: string of at most 2000 characters or null')
    } else {
      description = body.description.trim() || null
    }
  }

  const servings = body.servings
  if (
    typeof servings !== 'number' ||
    !Number.isInteger(servings) ||
    servings < 1 ||
    servings > 1000
  ) {
    issues.push('servings: integer between 1 and 1000 required')
  }

  const ingredients: RecipeInput['ingredients'] = []
  if (
    !Array.isArray(body.ingredients) ||
    body.ingredients.length < 1 ||
    body.ingredients.length > 100
  ) {
    issues.push('ingredients: array of 1 to 100 items required')
  } else {
    body.ingredients.forEach((line: unknown, index) => {
      const at = `ingredients[${index}]`
      if (!isRecord(line)) {
        issues.push(`${at}: object required`)
        return
      }
      const canonicalName =
        typeof line.canonicalName === 'string' ? line.canonicalName.trim() : ''
      const unit = typeof line.unit === 'string' ? line.unit.trim() : ''
      const quantity = line.quantity
      const ciqualCode = line.ciqualCode === undefined ? null : line.ciqualCode
      if (
        ciqualCode !== null &&
        (typeof ciqualCode !== 'string' || !/^\d{1,12}$/.test(ciqualCode))
      )
        issues.push(`${at}.ciqualCode: official code or null required`)
      const maxName = ciqualCode === null ? 100 : 500
      if (canonicalName.length < 1 || canonicalName.length > maxName) {
        issues.push(`${at}.canonicalName: valid ingredient name required`)
      }
      if (!RECIPE_UNITS.includes(unit as RecipeUnit)) {
        issues.push(`${at}.unit: one of g, kg, ml, l, piece required`)
      }
      if (
        typeof quantity !== 'number' ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        issues.push(`${at}.quantity: positive number required`)
      }
      if (typeof quantity === 'number') {
        ingredients.push({
          canonicalName,
          ciqualCode: ciqualCode as string | null,
          unit,
          quantity,
        })
      }
    })
  }

  const steps: RecipeInput['steps'] = []
  if (
    !Array.isArray(body.steps) ||
    body.steps.length < 1 ||
    body.steps.length > 200
  ) {
    issues.push('steps: array of 1 to 200 items required')
  } else {
    body.steps.forEach((step: unknown, index) => {
      const instruction =
        isRecord(step) && typeof step.instruction === 'string'
          ? step.instruction.trim()
          : ''
      if (instruction.length < 1 || instruction.length > 2000) {
        issues.push(
          `steps[${index}].instruction: 1 to 2000 characters required`,
        )
      }
      steps.push({ instruction })
    })
  }

  const parseIds = (field: 'tagIds' | 'equipmentIds'): number[] | undefined => {
    const value = body[field]
    if (value === undefined) return undefined
    if (
      !Array.isArray(value) ||
      value.length > 100 ||
      value.some(
        (id: unknown) =>
          typeof id !== 'number' ||
          !Number.isInteger(id) ||
          id < 1 ||
          id > 2147483647,
      )
    ) {
      issues.push(
        `${field}: array of at most 100 positive integer IDs required`,
      )
      return undefined
    }
    return [...new Set(value as number[])]
  }
  const tagIds = parseIds('tagIds')
  const equipmentIds = parseIds('equipmentIds')
  if (issues.length > 0) throw new RecipeValidationError(issues)
  return {
    ...(tagIds === undefined ? {} : { tagIds }),
    ...(equipmentIds === undefined ? {} : { equipmentIds }),
    title,
    description,
    servings: servings as number,
    ingredients,
    steps,
  }
}
