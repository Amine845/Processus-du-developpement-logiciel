import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../../', import.meta.url))
const temp = mkdtempSync(join(tmpdir(), 'recipe-db-'))
const cli = require.resolve('prisma/build/index.js')
// Do not inherit a developer/CI database URL: exercise the copied .env instead.
const env = { ...process.env }
delete env.DATABASE_URL
let db
let rejected = 0
function prisma(...args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: temp,
    env,
    encoding: 'utf8',
  })
  assert.equal(
    result.status,
    0,
    result.error?.message ?? result.stdout + result.stderr,
  )
}
async function invalid(sql, values = [], reason = /CHECK constraint failed/) {
  await assert.rejects(db.$executeRawUnsafe(sql, ...values), reason, sql)
  rejected++
}
try {
  mkdirSync(join(temp, 'prisma'))
  cpSync(
    join(root, 'src/server/prisma/schema.prisma'),
    join(temp, 'prisma/schema.prisma'),
  )
  cpSync(
    join(root, 'src/server/prisma/migrations'),
    join(temp, 'prisma/migrations'),
    { recursive: true },
  )
  cpSync(join(root, 'src/server/.env.example'), join(temp, '.env'))
  prisma('validate')
  prisma('migrate', 'deploy')
  assert.ok(
    existsSync(join(temp, 'prisma/dev.db')),
    'SQLite path must be relative to schema',
  )
  assert.ok(!existsSync(join(temp, 'dev.db')))
  assert.ok(!existsSync(join(temp, 'prisma/prisma/dev.db')))
  prisma('migrate', 'deploy')
  prisma(
    'migrate',
    'diff',
    '--from-schema-datasource',
    'prisma/schema.prisma',
    '--to-schema-datamodel',
    'prisma/schema.prisma',
    '--exit-code',
  )
  db = new PrismaClient({
    datasources: {
      db: { url: `file:${join(temp, 'prisma/dev.db').replaceAll('\\', '/')}` },
    },
  })
  const fk = await db.$queryRawUnsafe('PRAGMA foreign_keys')
  assert.equal(Number(fk[0].foreign_keys), 1)
  const tables = await db.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'",
  )
  assert.deepEqual(tables.map((t) => t.name).sort(), [
    'Ingredient',
    'Recipe',
    'RecipeIngredient',
    'RecipeStep',
  ])
  const recipe = await db.recipe.create({
    data: { title: 'Soupe', servings: 2 },
  })
  assert.equal(recipe.description, null)
  const second = await db.recipe.create({
    data: { title: 'Autre recette', servings: 1, description: 'Test' },
  })
  const ingredient = await db.ingredient.create({
    data: { canonicalName: 'Carotte' },
  })
  for (const [position, unit] of ['g', 'kg', 'ml', 'l', 'piece'].entries()) {
    await db.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        quantity: 0.5,
        unit,
        position: position + 1,
      },
    })
  }
  await db.recipeStep.create({
    data: { recipeId: recipe.id, position: 1, instruction: 'Cuire.' },
  })
  await db.recipeStep.create({
    data: { recipeId: second.id, position: 1, instruction: 'Servir.' },
  })
  await db.recipeIngredient.create({
    data: {
      recipeId: second.id,
      ingredientId: ingredient.id,
      quantity: 1,
      unit: 'g',
      position: 1,
    },
  })
  for (const title of ['', ' \t\n\r ', 'x'.repeat(201)]) {
    await invalid('INSERT INTO Recipe (title, servings) VALUES (?, 1)', [title])
  }
  for (const value of [0, -1, 1.5, 'oops', 2147483648]) {
    await invalid('INSERT INTO Recipe (title, servings) VALUES (?, ?)', [
      'Test',
      value,
    ])
    await invalid('UPDATE RecipeStep SET position = ? WHERE recipeId = ?', [
      value,
      recipe.id,
    ])
    await invalid(
      'UPDATE RecipeIngredient SET position = ? WHERE recipeId = ?',
      [value, second.id],
    )
  }
  for (const value of [0, -1, 'oops']) {
    await invalid(
      'UPDATE RecipeIngredient SET quantity = ? WHERE recipeId = ?',
      [value, recipe.id],
    )
  }
  await invalid('UPDATE RecipeIngredient SET quantity = 1e999')
  await invalid("UPDATE RecipeIngredient SET unit = 'cup'")
  await invalid("UPDATE Recipe SET title = ' '")
  await invalid("INSERT INTO Ingredient (canonicalName) VALUES ('\t ')")
  await invalid("UPDATE RecipeStep SET instruction = ''")
  await invalid(
    'INSERT INTO Recipe (title, servings) VALUES (NULL, 1)',
    [],
    /NOT NULL constraint failed/,
  )
  await invalid(
    'UPDATE RecipeIngredient SET quantity = NULL',
    [],
    /NOT NULL constraint failed/,
  )
  await invalid(
    'INSERT INTO RecipeStep (recipeId, position, instruction) VALUES (?, 1, ?)',
    [recipe.id, 'Doublon'],
    /UNIQUE constraint failed/,
  )
  await invalid(
    'INSERT INTO RecipeIngredient (recipeId, ingredientId, quantity, unit, position) VALUES (?, ?, 1, ?, 1)',
    [recipe.id, ingredient.id, 'g'],
    /UNIQUE constraint failed/,
  )
  await invalid(
    "INSERT INTO RecipeStep (recipeId, position, instruction) VALUES (999999, 1, 'Orpheline')",
    [],
    /FOREIGN KEY constraint failed/,
  )
  await invalid(
    'UPDATE RecipeIngredient SET recipeId = 999999 WHERE position = 2',
    [],
    /FOREIGN KEY constraint failed/,
  )
  await invalid(
    'UPDATE RecipeIngredient SET ingredientId = 999999',
    [],
    /FOREIGN KEY constraint failed/,
  )
  await assert.rejects(
    db.ingredient.delete({ where: { id: ingredient.id } }),
    (e) => e.code === 'P2003',
  )
  // Verify update actions and actual relation metadata, not just schema declarations.
  for (const [table, targets] of [
    ['RecipeStep', [['Recipe', 'CASCADE']]],
    [
      'RecipeIngredient',
      [
        ['Ingredient', 'RESTRICT'],
        ['Recipe', 'CASCADE'],
      ],
    ],
  ]) {
    const rows = await db.$queryRawUnsafe(`PRAGMA foreign_key_list("${table}")`)
    assert.deepEqual(
      rows.map((f) => [f.table, f.on_delete]).sort(),
      targets.sort(),
    )
    assert.ok(rows.every((f) => f.on_update === 'CASCADE'))
  }
  await db.recipe.update({ where: { id: recipe.id }, data: { id: 100 } })
  assert.equal(await db.recipeStep.count({ where: { recipeId: 100 } }), 1)
  assert.equal(await db.recipeIngredient.count({ where: { recipeId: 100 } }), 5)
  await db.ingredient.update({
    where: { id: ingredient.id },
    data: { id: 100 },
  })
  assert.equal(
    await db.recipeIngredient.count({ where: { ingredientId: 100 } }),
    6,
  )
  await db.recipe.delete({ where: { id: 100 } })
  assert.equal(await db.recipeStep.count({ where: { recipeId: 100 } }), 0)
  assert.equal(await db.recipeIngredient.count({ where: { recipeId: 100 } }), 0)
  assert.equal(await db.recipeStep.count(), 1)
  assert.equal(await db.ingredient.count(), 1)
  await db.recipe.delete({ where: { id: second.id } })
  await db.ingredient.delete({ where: { id: 100 } })
  assert.deepEqual(await db.$queryRawUnsafe('PRAGMA foreign_key_check'), [])
  const ignored = [
    '.env',
    '.env.local',
    'src/server/.env',
    'src/server/.env.production',
  ]
  for (const ext of ['db', 'sqlite', 'sqlite3']) {
    for (const suffix of ['', '-journal', '-wal', '-shm'])
      ignored.push(`src/server/prisma/test.${ext}${suffix}`)
  }
  for (const path of ignored) {
    const result = spawnSync(
      'git',
      ['check-ignore', '--no-index', '-q', path],
      { cwd: root },
    )
    assert.equal(result.status, 0, `Not ignored: ${path}`)
  }
  for (const path of [
    'src/server/.env.example',
    'src/server/prisma/schema.prisma',
    'src/server/prisma/migrations/migration_lock.toml',
    'src/server/prisma/migrations/20261007090000_initial_recipes/migration.sql',
  ]) {
    assert.equal(
      spawnSync('git', ['check-ignore', '--no-index', '-q', path], {
        cwd: root,
      }).status,
      1,
      `Unexpected ignore: ${path}`,
    )
  }
  console.log(
    `Database validation passed (${rejected} invalid SQL writes rejected; migration, path, relations and Git checks passed).`,
  )
} finally {
  if (db) await db.$disconnect()
  rmSync(temp, { recursive: true, force: true })
}
