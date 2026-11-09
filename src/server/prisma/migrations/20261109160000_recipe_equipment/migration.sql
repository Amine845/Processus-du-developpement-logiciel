-- Additive migration: equipment catalogue and recipe associations; existing data untouched.
-- CHECK constraints are maintained here: Prisma schema cannot represent them.
-- CreateTable
CREATE TABLE "Equipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL CONSTRAINT "Equipment_key_check" CHECK (typeof("key") = 'text' AND length("key") BETWEEN 1 AND 40 AND "key" NOT GLOB '*[^a-z0-9-]*' AND "key" NOT GLOB '-*' AND "key" NOT GLOB '*-'),
    "label" TEXT NOT NULL CONSTRAINT "Equipment_label_check" CHECK (typeof("label") = 'text' AND length(trim("label", char(9, 10, 11, 12, 13, 32))) > 0 AND length("label") <= 40),
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "RecipeEquipment" (
    "recipeId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,

    PRIMARY KEY ("recipeId", "equipmentId"),
    CONSTRAINT "RecipeEquipment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_key_key" ON "Equipment"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_label_key" ON "Equipment"("label");

-- CreateIndex
CREATE INDEX "RecipeEquipment_equipmentId_idx" ON "RecipeEquipment"("equipmentId");
