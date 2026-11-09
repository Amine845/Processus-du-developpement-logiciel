-- Additive migration: separate recipe vocabulary and associations; existing data untouched.
-- CHECK constraints are maintained here: Prisma schema cannot represent them.
-- CreateTable
CREATE TABLE "RecipeTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL CONSTRAINT "RecipeTag_key_check" CHECK (typeof("key") = 'text' AND length("key") BETWEEN 1 AND 40 AND "key" NOT GLOB '*[^a-z0-9-]*' AND "key" NOT GLOB '-*' AND "key" NOT GLOB '*-'),
    "label" TEXT NOT NULL CONSTRAINT "RecipeTag_label_check" CHECK (typeof("label") = 'text' AND length(trim("label", char(9, 10, 11, 12, 13, 32))) > 0 AND length("label") <= 40),
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "RecipeTagLink" (
    "recipeId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    PRIMARY KEY ("recipeId", "tagId"),
    CONSTRAINT "RecipeTagLink_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeTagLink_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "RecipeTag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeTag_key_key" ON "RecipeTag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeTag_label_key" ON "RecipeTag"("label");

-- CreateIndex
CREATE INDEX "RecipeTagLink_tagId_idx" ON "RecipeTagLink"("tagId");
