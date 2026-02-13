-- AlterTable
ALTER TABLE "candidato_skill" ADD COLUMN     "data_ultima_avaliacao" TIMESTAMP(3),
ADD COLUMN     "peso_avaliador" INTEGER;

-- CreateTable
CREATE TABLE "CandidatoAvaliacaoSkill" (
    "id" SERIAL NOT NULL,
    "candidato_skill_id" INTEGER NOT NULL,
    "data_avaliacao" TIMESTAMP(3),
    "avaliacao_pendente" BOOLEAN NOT NULL DEFAULT true,
    "prioridade_ordem" INTEGER NOT NULL,
    "reavaliar" BOOLEAN NOT NULL DEFAULT false,
    "data_pedido_reavaliar" TIMESTAMP(3),
    "avaliador_id" INTEGER,

    CONSTRAINT "CandidatoAvaliacaoSkill_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CandidatoAvaliacaoSkill" ADD CONSTRAINT "CandidatoAvaliacaoSkill_candidato_skill_id_fkey" FOREIGN KEY ("candidato_skill_id") REFERENCES "candidato_skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
