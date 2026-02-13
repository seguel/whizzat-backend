/*
  Warnings:

  - A unique constraint covering the columns `[perfil_tipo,perfil_id,tipo,referencia_id]` on the table `notificacao` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "notificacao_perfil_tipo_perfil_id_tipo_referencia_id_key" ON "notificacao"("perfil_tipo", "perfil_id", "tipo", "referencia_id");
