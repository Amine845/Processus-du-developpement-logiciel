-- Additive: historical links and all nutrient rows remain intact.
ALTER TABLE "CiqualFood" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'unclassified' CHECK ("category" IN ('food', 'prepared_dish', 'unclassified'));
ALTER TABLE "CiqualFood" ADD COLUMN "groupCode" TEXT;
ALTER TABLE "CiqualFood" ADD COLUMN "groupName" TEXT;
ALTER TABLE "CiqualFood" ADD COLUMN "subgroupCode" TEXT;
ALTER TABLE "CiqualFood" ADD COLUMN "subgroupName" TEXT;
ALTER TABLE "CiqualFood" ADD COLUMN "detailGroupCode" TEXT;
ALTER TABLE "CiqualFood" ADD COLUMN "detailGroupName" TEXT;
ALTER TABLE "CiqualFood" ADD COLUMN "classificationVersion" TEXT;
ALTER TABLE "CiqualFood" ADD COLUMN "classificationRule" TEXT;
ALTER TABLE "CiqualFood" ADD COLUMN "applicationTags" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "CiqualSyncState" ADD COLUMN "classificationVersion" TEXT;
