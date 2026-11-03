-- Additive: existing tables and rows remain in place.
CREATE TABLE "CiqualImport" (
 "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
 "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "source" TEXT NOT NULL, "version" TEXT NOT NULL, "downloadedAt" TEXT NOT NULL,
 "sourceSha256" TEXT NOT NULL, "fileSha256" TEXT NOT NULL,
 "format" TEXT NOT NULL, "attribution" TEXT NOT NULL, "license" TEXT NOT NULL,
 "rowsRead" INTEGER NOT NULL, "rowsAccepted" INTEGER NOT NULL, "rowsRejected" INTEGER NOT NULL
);
CREATE UNIQUE INDEX "CiqualImport_fileSha256_key" ON "CiqualImport"("fileSha256");
CREATE TABLE "CiqualFood" (
 "code" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "version" TEXT NOT NULL,
 "baseQuantity" REAL NOT NULL DEFAULT 100, "baseUnit" TEXT NOT NULL DEFAULT 'g',
 "importId" INTEGER NOT NULL,
 FOREIGN KEY ("importId") REFERENCES "CiqualImport"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CiqualFood_name_idx" ON "CiqualFood"("name");
CREATE TABLE "CiqualNutrient" (
 "foodCode" TEXT NOT NULL, "key" TEXT NOT NULL, "unit" TEXT NOT NULL,
 "raw" TEXT NOT NULL, "status" TEXT NOT NULL, "value" REAL,
 PRIMARY KEY ("foodCode", "key"),
 FOREIGN KEY ("foodCode") REFERENCES "CiqualFood"("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
ALTER TABLE "Ingredient" ADD COLUMN "ciqualCode" TEXT REFERENCES "CiqualFood"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
