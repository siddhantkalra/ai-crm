/*
  Warnings:

  - A unique constraint covering the columns `[prototypeSource,prototypeKey]` on the table `Engagement` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Engagement" ADD COLUMN     "prototypeKey" TEXT,
ADD COLUMN     "prototypeSource" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_prototypeSource_prototypeKey_key" ON "Engagement"("prototypeSource", "prototypeKey");
