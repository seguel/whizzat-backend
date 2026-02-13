/*
  Warnings:

  - Added the required column `linguagem` to the `candidato_avaliacao_skill` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "usuario_perfil_avaliador_ativo_avaliar_todos_idx";

-- AlterTable
ALTER TABLE "candidato_avaliacao_skill" ADD COLUMN     "linguagem" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "usuario_perfil_avaliador_ativo_avaliar_todos_liberado_avali_idx" ON "usuario_perfil_avaliador"("ativo", "avaliar_todos", "liberado_avaliar", "linguagem");
