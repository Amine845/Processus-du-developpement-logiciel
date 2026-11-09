-- Preserve IDs, recipes and exact existing links. Never guess a CIQUAL code from a name.
ALTER TABLE "Ingredient" ADD COLUMN "identityKey" TEXT;
DROP INDEX "Ingredient_canonicalName_key";
UPDATE "Ingredient" SET "identityKey" = CASE
  WHEN "ciqualCode" IS NULL THEN 'manual:' || "canonicalName"
  WHEN "id" = (SELECT MIN(i."id") FROM "Ingredient" i WHERE i."ciqualCode" = "Ingredient"."ciqualCode") THEN 'ciqual:' || "ciqualCode"
  ELSE 'legacy:' || "id" END;
CREATE UNIQUE INDEX "Ingredient_identityKey_key" ON "Ingredient"("identityKey");
CREATE INDEX "Ingredient_canonicalName_idx" ON "Ingredient"("canonicalName");
