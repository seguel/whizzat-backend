/*
  Warnings:

  - A unique constraint covering the columns `[codigo,linguagem]` on the table `modalidade_trabalho` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "modalidade_trabalho_modalidade_trabalho_id_idx";

-- AlterTable
ALTER TABLE "modalidade_trabalho" ADD COLUMN     "codigo" TEXT,
ALTER COLUMN "ativo" SET DEFAULT true;

-- CreateTable
CREATE TABLE "candidato_modalidade_trabalho" (
    "candidato_id" INTEGER NOT NULL,
    "modalidade_id" INTEGER NOT NULL,

    CONSTRAINT "candidato_modalidade_trabalho_pkey" PRIMARY KEY ("candidato_id","modalidade_id")
);

-- CreateIndex
CREATE INDEX "candidato_modalidade_trabalho_modalidade_id_idx" ON "candidato_modalidade_trabalho"("modalidade_id");

-- CreateIndex
CREATE INDEX "modalidade_trabalho_linguagem_ativo_idx" ON "modalidade_trabalho"("linguagem", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "modalidade_trabalho_codigo_linguagem_key" ON "modalidade_trabalho"("codigo", "linguagem");

-- AddForeignKey
ALTER TABLE "candidato_modalidade_trabalho" ADD CONSTRAINT "candidato_modalidade_trabalho_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "usuario_perfil_candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_modalidade_trabalho" ADD CONSTRAINT "candidato_modalidade_trabalho_modalidade_id_fkey" FOREIGN KEY ("modalidade_id") REFERENCES "modalidade_trabalho"("modalidade_trabalho_id") ON DELETE RESTRICT ON UPDATE CASCADE;
