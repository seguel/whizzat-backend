/*
  Warnings:

  - A unique constraint covering the columns `[versao,linguagem]` on the table `disc_questionario` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "disc_questionario_versao_key";

-- AlterTable
ALTER TABLE "disc_questionario" ADD COLUMN     "linguagem" TEXT NOT NULL DEFAULT 'pt-BR';

-- CreateIndex
CREATE UNIQUE INDEX "disc_questionario_versao_linguagem_key" ON "disc_questionario"("versao", "linguagem");
