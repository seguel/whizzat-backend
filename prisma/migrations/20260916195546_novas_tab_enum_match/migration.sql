-- CreateEnum
CREATE TYPE "TipoConviteRecrutador" AS ENUM ('VAGA', 'OPORTUNIDADE', 'PALESTRA_EVENTO', 'MENTORIA', 'PROJETO_CONSULTORIA', 'NETWORKING', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusConviteRecrutador" AS ENUM ('CONVITE_ENVIADO', 'CONVITE_ACEITO', 'CONVITE_RECUSADO', 'AGENDA_ENVIADA', 'AGENDADO', 'ENTREVISTA_REALIZADA', 'FINALIZADO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoNotificacao" ADD VALUE 'NOVO_CONVITE_RECRUTADOR';
ALTER TYPE "TipoNotificacao" ADD VALUE 'CONVITE_RECRUTADOR_ACEITO';
ALTER TYPE "TipoNotificacao" ADD VALUE 'CONVITE_RECRUTADOR_RECUSADO';
ALTER TYPE "TipoNotificacao" ADD VALUE 'NOVA_AGENDA_RECRUTADOR';
ALTER TYPE "TipoNotificacao" ADD VALUE 'AGENDA_RECRUTADOR_ACEITA';
ALTER TYPE "TipoNotificacao" ADD VALUE 'AGENDA_RECRUTADOR_RECUSADA';
ALTER TYPE "TipoNotificacao" ADD VALUE 'PROCESSO_RECRUTADOR_FINALIZADO';

-- CreateTable
CREATE TABLE "recrutador_convite_candidato" (
    "id" SERIAL NOT NULL,
    "recrutador_id" INTEGER NOT NULL,
    "candidato_id" INTEGER NOT NULL,
    "empresa_id" INTEGER,
    "vaga_id" INTEGER,
    "tipo" "TipoConviteRecrutador" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" "StatusConviteRecrutador" NOT NULL DEFAULT 'CONVITE_ENVIADO',
    "data_convite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_aceite" TIMESTAMP(3),
    "data_recusa" TIMESTAMP(3),
    "aprovado" BOOLEAN,
    "parecer" TEXT,
    "data_finalizacao" TIMESTAMP(3),

    CONSTRAINT "recrutador_convite_candidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recrutador_convite_agenda" (
    "id" SERIAL NOT NULL,
    "convite_id" INTEGER NOT NULL,
    "data_hora_agenda" TIMESTAMP(3) NOT NULL,
    "status" "AgendaStatus" NOT NULL DEFAULT 'PENDENTE',
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_resposta" TIMESTAMP(3),

    CONSTRAINT "recrutador_convite_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recrutador_convite_candidato_recrutador_id_idx" ON "recrutador_convite_candidato"("recrutador_id");

-- CreateIndex
CREATE INDEX "recrutador_convite_candidato_candidato_id_idx" ON "recrutador_convite_candidato"("candidato_id");

-- CreateIndex
CREATE INDEX "recrutador_convite_candidato_empresa_id_idx" ON "recrutador_convite_candidato"("empresa_id");

-- CreateIndex
CREATE INDEX "recrutador_convite_candidato_vaga_id_idx" ON "recrutador_convite_candidato"("vaga_id");

-- CreateIndex
CREATE INDEX "recrutador_convite_candidato_status_idx" ON "recrutador_convite_candidato"("status");

-- CreateIndex
CREATE UNIQUE INDEX "recrutador_convite_agenda_convite_id_key" ON "recrutador_convite_agenda"("convite_id");

-- CreateIndex
CREATE INDEX "recrutador_convite_agenda_convite_id_idx" ON "recrutador_convite_agenda"("convite_id");

-- AddForeignKey
ALTER TABLE "recrutador_convite_candidato" ADD CONSTRAINT "recrutador_convite_candidato_recrutador_id_fkey" FOREIGN KEY ("recrutador_id") REFERENCES "usuario_perfil_recrutador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recrutador_convite_candidato" ADD CONSTRAINT "recrutador_convite_candidato_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "usuario_perfil_candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recrutador_convite_candidato" ADD CONSTRAINT "recrutador_convite_candidato_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recrutador_convite_candidato" ADD CONSTRAINT "recrutador_convite_candidato_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "empresa_vaga"("vaga_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recrutador_convite_agenda" ADD CONSTRAINT "recrutador_convite_agenda_convite_id_fkey" FOREIGN KEY ("convite_id") REFERENCES "recrutador_convite_candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
