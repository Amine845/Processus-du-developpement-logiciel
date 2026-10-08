-- CHECK constraints are maintained here: Prisma schema cannot represent them.
-- CreateTable
CREATE TABLE "Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL CONSTRAINT "Recipe_title_check" CHECK (typeof("title") = 'text' AND length(trim("title", char(9, 10, 11, 12, 13, 32))) > 0 AND length("title") <= 200),
    "description" TEXT,
    "servings" INTEGER NOT NULL CONSTRAINT "Recipe_servings_check" CHECK (typeof("servings") = 'integer' AND "servings" BETWEEN 1 AND 2147483647)
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "canonicalName" TEXT NOT NULL CONSTRAINT "Ingredient_name_check" CHECK (typeof("canonicalName") = 'text' AND length(trim("canonicalName", char(9, 10, 11, 12, 13, 32))) > 0)
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipeId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL CONSTRAINT "RecipeIngredient_quantity_check" CHECK (typeof("quantity") IN ('integer', 'real') AND "quantity" > 0 AND "quantity" <= 1.7976931348623157e308),
    "unit" TEXT NOT NULL CONSTRAINT "RecipeIngredient_unit_check" CHECK ("unit" IN ('g', 'kg', 'ml', 'l', 'piece')),
    "position" INTEGER NOT NULL CHECK (typeof("position") = 'integer' AND "position" BETWEEN 1 AND 2147483647),
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeStep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipeId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL CHECK (typeof("position") = 'integer' AND "position" BETWEEN 1 AND 2147483647),
    "instruction" TEXT NOT NULL CONSTRAINT "RecipeStep_instruction_check" CHECK (typeof("instruction") = 'text' AND length(trim("instruction", char(9, 10, 11, 12, 13, 32))) > 0),
    CONSTRAINT "RecipeStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RecipeIngredient_ingredientId_idx" ON "RecipeIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_position_key" ON "RecipeIngredient"("recipeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeStep_recipeId_position_key" ON "RecipeStep"("recipeId", "position");
