/*
  Warnings:

  - A unique constraint covering the columns `[avaliador_id,avaliacao_skill_id]` on the table `AvaliadorRankingAvaliacao` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `data_expiracao` to the `AvaliadorRankingAvaliacao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AvaliadorRankingAvaliacao" ADD COLUMN     "data_expiracao" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AvaliadorRankingAvaliacao_avaliador_id_avaliacao_skill_id_key" ON "AvaliadorRankingAvaliacao"("avaliador_id", "avaliacao_skill_id");
