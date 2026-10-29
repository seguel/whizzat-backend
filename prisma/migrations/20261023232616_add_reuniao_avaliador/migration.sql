-- AlterEnum
ALTER TYPE "StatusAvaliacao" ADD VALUE 'ENTREVISTA_CONFIRMADA';

-- AlterTable
ALTER TABLE "avaliador_avaliacao_skill_agenda" ADD COLUMN     "data_envio_link" TIMESTAMP(3),
ADD COLUMN     "link_reuniao" TEXT,
ADD COLUMN     "plataforma" "PlataformaEntrevista",
ADD COLUMN     "provider_meeting_id" TEXT;
