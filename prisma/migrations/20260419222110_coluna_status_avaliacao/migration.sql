-- CreateEnum
CREATE TYPE "StatusAvaliacao" AS ENUM ('CONVITE_ACEITO', 'QUESTIONARIO_ENVIADO', 'ENTREVISTA_REALIZADA', 'FINALIZADO');

-- AlterTable
ALTER TABLE "avaliador_avaliacao_skill" ADD COLUMN     "status" "StatusAvaliacao" NOT NULL DEFAULT 'CONVITE_ACEITO';
