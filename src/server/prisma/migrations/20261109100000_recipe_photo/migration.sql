-- CHECK constraints are maintained here: Prisma schema cannot represent them.
ALTER TABLE "Recipe" ADD COLUMN "photoId" TEXT
  CONSTRAINT "Recipe_photoId_check" CHECK (
    "photoId" IS NULL OR (length("photoId") = 32 AND "photoId" NOT GLOB '*[^0-9a-f]*')
  );

CREATE UNIQUE INDEX "Recipe_photoId_key" ON "Recipe"("photoId");