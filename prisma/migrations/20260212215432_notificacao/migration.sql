-- CreateEnum
CREATE TYPE "PerfilTipo" AS ENUM ('CANDIDATO', 'RECRUTADOR', 'AVALIADOR');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('NOVA_SKILL', 'NOVA_MENSAGEM', 'NOVA_AVALIACAO');

-- CreateTable
CREATE TABLE "notificacao" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "perfil_tipo" "PerfilTipo" NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "referencia_id" INTEGER,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "enviada_email" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacao_usuario_id_perfil_tipo_idx" ON "notificacao"("usuario_id", "perfil_tipo");

-- CreateIndex
CREATE INDEX "notificacao_usuario_id_lida_idx" ON "notificacao"("usuario_id", "lida");

-- CreateIndex
CREATE INDEX "notificacao_enviada_email_idx" ON "notificacao"("enviada_email");

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
