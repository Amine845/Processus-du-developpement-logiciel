// @vitest-environment jsdom
import React from 'react'
import { beforeAll, afterAll, afterEach, it, expect, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  act,
} from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import RecipeCreatePage from '../../src/client/pages/RecipeCreatePage'
import RecipeDetailPage from '../../src/client/pages/RecipeDetailPage'
const require = createRequire(import.meta.url)
// Load the actual Node build, avoiding browser resolution of Prisma under jsdom.
const { PrismaClient } = require('@prisma/client')
const { createRecipeServer } = require('../../dist-server/server/server.js')
const {
  createPrismaRecipeRepository,
} = require('../../dist-server/server/infrastructure/prisma-recipe-repository.js')
const {
  createPrismaCiqualRepository,
} = require('../../dist-server/server/infrastructure/prisma-ciqual-repository.js')
const {
  createPrismaRecipeTagRepository,
} = require('../../dist-server/server/infrastructure/prisma-recipe-tag-repository.js')
const {
  createPrismaRecipeEquipmentRepository,
} = require('../../dist-server/server/infrastructure/prisma-recipe-equipment-repository.js')
const temp = mkdtempSync(join(tmpdir(), 'recipe-ui-'))
const url = `file:${join(temp, 'test.db').replaceAll('\\', '/')}`
const db = new PrismaClient({ datasources: { db: { url } } })
const nativeFetch = globalThis.fetch
let server,
  base,
  failPost = false
const mount = (path = '/recipes/new') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/recipes/new" element={<RecipeCreatePage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
beforeAll(async () => {
  writeFileSync(join(temp, 'test.db'), '')
  const migration = spawnSync(
    process.execPath,
    [
      require.resolve('prisma/build/index.js'),
      'migrate',
      'deploy',
      '--schema',
      'src/server/prisma/schema.prisma',
    ],
    { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' },
  )
  expect(migration.status, migration.stdout + migration.stderr).toBe(0)
  const audit = await db.ciqualImport.create({
    data: {
      source: 'https://doi.org/10.57745/RDMHWY',
      version: 'test',
      downloadedAt: '2026-11-05',
      sourceSha256: 'test',
      fileSha256: 'ui-test',
      format: 'test',
      attribution: 'Anses, fixture UI',
      license: 'Etalab-2.0',
      rowsRead: 1,
      rowsAccepted: 1,
      rowsRejected: 0,
    },
  })
  await db.ciqualFood.create({
    data: {
      code: '22000',
      name: 'Oeuf cru',
      version: 'test',
      importId: audit.id,
      category: 'food',
      nutrients: {
        create: {
          key: '328',
          unit: 'kcal',
          raw: '140',
          value: 140,
          status: 'exact',
        },
      },
    },
  })
  await db.recipeTag.create({ data: { key: 'gourmand', label: 'Gourmand' } })
  await db.equipment.create({ data: { key: 'four', label: 'Four' } })
  server = createRecipeServer(
    createPrismaRecipeRepository(db),
    createPrismaCiqualRepository(db),
    undefined,
    undefined,
    createPrismaRecipeTagRepository(db),
    createPrismaRecipeEquipmentRepository(db),
  )
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
  vi.stubGlobal('fetch', (target, options) => {
    if (failPost && options?.method === 'POST')
      return Promise.reject(new Error('network down'))
    return nativeFetch(
      String(target).replace('http://localhost:3001', base),
      options,
    )
  })
}, 15000)
afterEach(() => {
  cleanup()
  failPost = false
})
afterAll(async () => {
  vi.unstubAllGlobals()
  server?.closeAllConnections()
  if (server) await new Promise((resolve) => server.close(resolve))
  await db.$disconnect()
  rmSync(temp, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100,
  })
})

it('real selection → HTTP POST → detail GET → unmount/reload, distinct description and ordered steps', async () => {
  mount()
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Gourmand' }))
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Four' }))
  fireEvent.change(screen.getByLabelText('Titre'), {
    target: { value: 'Recette UI' },
  })
  const search = screen.getByRole('combobox', { name: 'Ingrédient 1' })
  fireEvent.change(search, { target: { value: 'œuf' } })
  fireEvent.click(await screen.findByRole('option', { name: /Oeuf cru/ }))
  await screen.findByRole('region', {
    name: 'Valeurs nutritionnelles de Oeuf cru',
  })
  fireEvent.change(screen.getByLabelText('Quantité 1'), {
    target: { value: '100' },
  })
  fireEvent.change(screen.getByLabelText('Étape 1'), {
    target: { value: 'Cuire' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter une étape' }))
  fireEvent.change(screen.getByLabelText('Étape 2'), {
    target: { value: 'Battre' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Monter l’étape 2' }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Enregistrer la recette' }),
  )
  await screen.findByRole('heading', { name: 'Recette UI' })
  const saved = await db.recipe.findUnique({
    where: { title: 'Recette UI' },
    include: {
      ingredients: { include: { ingredient: true } },
      steps: { orderBy: { position: 'asc' } },
    },
  })
  expect(saved.description).toBeNull()
  expect(await db.recipeTagLink.count({ where: { recipeId: saved.id } })).toBe(
    1,
  )
  expect(
    await db.recipeEquipment.count({ where: { recipeId: saved.id } }),
  ).toBe(1)
  expect(saved.ingredients[0].ingredient.ciqualCode).toBe('22000')
  expect(saved.steps.map((s) => s.instruction)).toEqual(['Battre', 'Cuire'])
  cleanup()
  mount(`/recipes/${saved.id}`)
  await screen.findByRole('heading', { name: 'Recette UI' })
  await screen.findByRole('region', {
    name: 'Valeurs nutritionnelles de Oeuf cru',
  })
  expect(screen.getAllByText(/code 22000/).length).toBeGreaterThan(0)
  expect(screen.getByText('Gourmand')).toBeTruthy()
  expect(screen.getByText('Four')).toBeTruthy()
})

it('changing selected text invalidates the code; manual is explicit and network failure preserves the draft', async () => {
  mount()
  fireEvent.change(screen.getByLabelText('Titre'), {
    target: { value: 'Manuel UI' },
  })
  const search = screen.getByRole('combobox', { name: 'Ingrédient 1' })
  fireEvent.change(search, { target: { value: 'œuf' } })
  fireEvent.click(await screen.findByRole('option', { name: /Oeuf cru/ }))
  fireEvent.change(search, { target: { value: 'Oeuf cru manuel' } })
  fireEvent.change(screen.getByLabelText('Quantité 1'), {
    target: { value: '2' },
  })
  fireEvent.change(screen.getByLabelText('Étape 1'), {
    target: { value: 'Servir' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Enregistrer la recette' }),
  )
  expect((await screen.findByRole('alert')).textContent).toMatch(
    /sélectionnez un aliment/,
  )
  expect(
    await db.recipe.findUnique({ where: { title: 'Manuel UI' } }),
  ).toBeNull()
  fireEvent.click(
    screen.getByRole('option', { name: /comme ingrédient manuel/ }),
  )
  failPost = true
  fireEvent.click(
    screen.getByRole('button', { name: 'Enregistrer la recette' }),
  )
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toMatch(
      /saisie est conservée/,
    ),
  )
  expect(search.value).toBe('Oeuf cru manuel')
  expect(screen.getByLabelText('Quantité 1').value).toBe('2')
  expect(screen.getByLabelText('Étape 1').value).toBe('Servir')
  failPost = false
  fireEvent.click(
    screen.getByRole('button', { name: 'Enregistrer la recette' }),
  )
  await screen.findByRole('heading', { name: 'Manuel UI' })
  const saved = await db.recipe.findUnique({
    where: { title: 'Manuel UI' },
    include: { ingredients: { include: { ingredient: true } } },
  })
  expect(saved.ingredients[0].ingredient.ciqualCode).toBeNull()
  expect(within(screen.getByRole('article')).queryByRole('region')).toBeNull()
})

it('ignores a stale async response even when the transport ignores cancellation', async () => {
  const forward = globalThis.fetch
  let release
  vi.stubGlobal('fetch', (target, options) => {
    if (String(target).includes('q=lent'))
      return new Promise((resolve) => {
        release = resolve
      })
    return forward(target, options)
  })
  try {
    mount()
    const search = screen.getByRole('combobox', { name: 'Ingrédient 1' })
    fireEvent.change(search, { target: { value: 'lent' } })
    await waitFor(() => expect(release).toBeTypeOf('function'))
    fireEvent.change(search, { target: { value: 'œuf' } })
    await screen.findByRole('option', { name: /Oeuf cru/ })
    await act(async () =>
      release(
        new Response(
          JSON.stringify({
            query: 'lent',
            minLength: 2,
            limit: 10,
            truncated: false,
            results: [
              {
                code: '1',
                name: 'Résultat périmé',
                category: 'food',
                source: 'test',
                version: 'test',
                baseQuantity: 100,
                baseUnit: 'g',
              },
            ],
          }),
        ),
      ),
    )
    expect(screen.queryByText('Résultat périmé')).toBeNull()
    expect(screen.getByRole('option', { name: /Oeuf cru/ })).toBeTruthy()
  } finally {
    vi.stubGlobal('fetch', forward)
  }
})
