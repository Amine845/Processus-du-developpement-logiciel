-- Additive migration: no existing table is altered, so recipes and CIQUAL links are untouched.
-- CHECK constraints are maintained here: Prisma schema cannot represent them.
-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL CONSTRAINT "Tag_key_check" CHECK (typeof("key") = 'text' AND length("key") BETWEEN 1 AND 40 AND "key" NOT GLOB '*[^a-z0-9-]*' AND "key" NOT GLOB '-*' AND "key" NOT GLOB '*-'),
    "label" TEXT NOT NULL CONSTRAINT "Tag_label_check" CHECK (typeof("label") = 'text' AND length(trim("label", char(9, 10, 11, 12, 13, 32))) > 0 AND length("label") <= 40),
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "IngredientTag" (
    "ingredientId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    PRIMARY KEY ("ingredientId", "tagId"),
    CONSTRAINT "IngredientTag_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IngredientTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_key_key" ON "Tag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_label_key" ON "Tag"("label");

-- CreateIndex
CREATE INDEX "IngredientTag_tagId_idx" ON "IngredientTag"("tagId");
