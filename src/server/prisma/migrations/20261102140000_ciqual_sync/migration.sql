ALTER TABLE "CiqualImport" ADD COLUMN "payload" TEXT;
ALTER TABLE "CiqualFood" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CiqualFood" ADD COLUMN "rawData" TEXT;
CREATE TABLE "CiqualSyncState" (
 "id" INTEGER NOT NULL PRIMARY KEY,
 "checkedAt" DATETIME, "releaseKey" TEXT, "lastError" TEXT
);
