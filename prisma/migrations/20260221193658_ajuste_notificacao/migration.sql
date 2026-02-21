-- CreateIndex
CREATE INDEX "notificacao_usuario_id_perfil_tipo_lida_idx" ON "notificacao"("usuario_id", "perfil_tipo", "lida");
