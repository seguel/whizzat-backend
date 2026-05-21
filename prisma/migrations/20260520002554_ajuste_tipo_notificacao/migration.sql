/*
  Warnings:

  - A unique constraint covering the columns `[perfil_tipo,usuario_id,tipo,referencia_id,titulo]` on the table `notificacao` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TipoNotificacao" ADD VALUE 'NOVA_MENSAGEM_FINALIZADA';

-- DropIndex
DROP INDEX "notificacao_perfil_tipo_usuario_id_tipo_referencia_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "notificacao_perfil_tipo_usuario_id_tipo_referencia_id_titul_key" ON "notificacao"("perfil_tipo", "usuario_id", "tipo", "referencia_id", "titulo");
