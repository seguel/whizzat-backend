/*
  Warnings:

  - You are about to drop the `AvaliadorAvaliacaoSkill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AvaliadorRankingAvaliacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CandidatoAvaliacaoSkill` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AvaliadorAvaliacaoSkill" DROP CONSTRAINT "AvaliadorAvaliacaoSkill_avaliacao_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "AvaliadorAvaliacaoSkill" DROP CONSTRAINT "AvaliadorAvaliacaoSkill_avaliador_id_fkey";

-- DropForeignKey
ALTER TABLE "AvaliadorRankingAvaliacao" DROP CONSTRAINT "AvaliadorRankingAvaliacao_avaliacao_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "AvaliadorRankingAvaliacao" DROP CONSTRAINT "AvaliadorRankingAvaliacao_avaliador_id_fkey";

-- DropForeignKey
ALTER TABLE "CandidatoAvaliacaoSkill" DROP CONSTRAINT "CandidatoAvaliacaoSkill_avaliador_id_fkey";

-- DropForeignKey
ALTER TABLE "CandidatoAvaliacaoSkill" DROP CONSTRAINT "CandidatoAvaliacaoSkill_candidato_skill_id_fkey";

-- DropTable
DROP TABLE "AvaliadorAvaliacaoSkill";

-- DropTable
DROP TABLE "AvaliadorRankingAvaliacao";

-- DropTable
DROP TABLE "CandidatoAvaliacaoSkill";

-- CreateTable
CREATE TABLE "candidato_avaliacao_skill" (
    "id" SERIAL NOT NULL,
    "candidato_skill_id" INTEGER NOT NULL,
    "data_avaliacao" TIMESTAMP(3),
    "avaliacao_pendente" BOOLEAN NOT NULL DEFAULT true,
    "prioridade_ordem" INTEGER NOT NULL,
    "reavaliar" BOOLEAN NOT NULL DEFAULT false,
    "data_pedido_reavaliar" TIMESTAMP(3),
    "avaliador_id" INTEGER,

    CONSTRAINT "candidato_avaliacao_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_ranking_avaliacao" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "avaliacao_skill_id" INTEGER NOT NULL,
    "data_convite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_expiracao" TIMESTAMP(3) NOT NULL,
    "aceite" BOOLEAN,
    "data_aceite_recusa" TIMESTAMP(3),

    CONSTRAINT "avaliador_ranking_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_avaliacao_skill" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "avaliacao_skill_id" INTEGER NOT NULL,
    "data_avaliacao" TIMESTAMP(3),
    "peso" INTEGER,
    "comentario" TEXT,
    "data_aceite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliador_avaliacao_skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_avaliacao_skill_id_idx" ON "avaliador_ranking_avaliacao"("avaliacao_skill_id");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_avaliador_id_idx" ON "avaliador_ranking_avaliacao"("avaliador_id");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_aceite_idx" ON "avaliador_ranking_avaliacao"("aceite");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_data_expiracao_idx" ON "avaliador_ranking_avaliacao"("data_expiracao");

-- CreateIndex
CREATE UNIQUE INDEX "avaliador_ranking_avaliacao_avaliador_id_avaliacao_skill_id_key" ON "avaliador_ranking_avaliacao"("avaliador_id", "avaliacao_skill_id");

-- CreateIndex
CREATE INDEX "avaliador_skill_skill_id_idx" ON "avaliador_skill"("skill_id");

-- CreateIndex
CREATE INDEX "usuario_perfil_avaliador_ativo_avaliar_todos_idx" ON "usuario_perfil_avaliador"("ativo", "avaliar_todos");

-- AddForeignKey
ALTER TABLE "candidato_avaliacao_skill" ADD CONSTRAINT "candidato_avaliacao_skill_candidato_skill_id_fkey" FOREIGN KEY ("candidato_skill_id") REFERENCES "candidato_skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_avaliacao_skill" ADD CONSTRAINT "candidato_avaliacao_skill_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_ranking_avaliacao" ADD CONSTRAINT "avaliador_ranking_avaliacao_avaliacao_skill_id_fkey" FOREIGN KEY ("avaliacao_skill_id") REFERENCES "candidato_avaliacao_skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_ranking_avaliacao" ADD CONSTRAINT "avaliador_ranking_avaliacao_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill" ADD CONSTRAINT "avaliador_avaliacao_skill_avaliacao_skill_id_fkey" FOREIGN KEY ("avaliacao_skill_id") REFERENCES "candidato_avaliacao_skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill" ADD CONSTRAINT "avaliador_avaliacao_skill_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
