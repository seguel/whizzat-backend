/*
  Warnings:

  - Added the required column `ordem` to the `avaliador_questionario_pergunta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "avaliador_questionario_pergunta" ADD COLUMN     "ordem" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "avaliador_questionario_pergunta_questionario_id_ordem_idx" ON "avaliador_questionario_pergunta"("questionario_id", "ordem");
