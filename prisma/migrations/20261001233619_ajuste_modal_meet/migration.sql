-- CreateEnum
CREATE TYPE "PlataformaEntrevista" AS ENUM ('GOOGLE_MEET', 'MICROSOFT_TEAMS', 'ZOOM', 'LINK_EXTERNO');

-- AlterEnum
ALTER TYPE "StatusConviteRecrutador" ADD VALUE 'ENTREVISTA_CONFIRMADA';

-- AlterTable
ALTER TABLE "recrutador_convite_agenda" ADD COLUMN     "data_envio_link" TIMESTAMP(3),
ADD COLUMN     "link_reuniao" TEXT,
ADD COLUMN     "plataforma" "PlataformaEntrevista";
