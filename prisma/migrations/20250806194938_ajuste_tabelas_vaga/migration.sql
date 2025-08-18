/*
  Warnings:

  - A unique constraint covering the columns `[skill]` on the table `skill` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `data_cadastro` to the `empresa_vaga` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "empresa_vaga" ADD COLUMN     "data_cadastro" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "skill" ALTER COLUMN "ativo" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "skill_skill_key" ON "skill"("skill");
