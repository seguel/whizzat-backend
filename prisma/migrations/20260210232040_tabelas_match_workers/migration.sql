/*
  Warnings:

  - Added the required column `pontos` to the `usuario_perfil_avaliador` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usuario_perfil_avaliador" ADD COLUMN     "pontos" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "AvaliadorRankingAvaliacao" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "avaliacao_skill_id" INTEGER NOT NULL,
    "data_convite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceite" BOOLEAN,
    "data_aceite_recusa" TIMESTAMP(3),

    CONSTRAINT "AvaliadorRankingAvaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliadorAvaliacaoSkill" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "avaliacao_skill_id" INTEGER NOT NULL,
    "data_avaliacao" TIMESTAMP(3),
    "peso" INTEGER,
    "comentario" TEXT,
    "data_aceite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvaliadorAvaliacaoSkill_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CandidatoAvaliacaoSkill" ADD CONSTRAINT "CandidatoAvaliacaoSkill_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliadorRankingAvaliacao" ADD CONSTRAINT "AvaliadorRankingAvaliacao_avaliacao_skill_id_fkey" FOREIGN KEY ("avaliacao_skill_id") REFERENCES "CandidatoAvaliacaoSkill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliadorRankingAvaliacao" ADD CONSTRAINT "AvaliadorRankingAvaliacao_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliadorAvaliacaoSkill" ADD CONSTRAINT "AvaliadorAvaliacaoSkill_avaliacao_skill_id_fkey" FOREIGN KEY ("avaliacao_skill_id") REFERENCES "CandidatoAvaliacaoSkill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliadorAvaliacaoSkill" ADD CONSTRAINT "AvaliadorAvaliacaoSkill_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
