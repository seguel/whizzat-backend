-- AlterTable
ALTER TABLE "avaliador_avaliacao_skill" ADD COLUMN     "comentario_resposta" TEXT;

-- AlterTable
ALTER TABLE "avaliador_questionario_pergunta" ADD COLUMN     "obrigatorio" BOOLEAN NOT NULL DEFAULT false;
