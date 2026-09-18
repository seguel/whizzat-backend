-- DropIndex
DROP INDEX "notificacao_perfil_tipo_usuario_id_tipo_referencia_id_titul_key";

-- CreateIndex
CREATE INDEX "notificacao_tipo_referencia_id_idx" ON "notificacao"("tipo", "referencia_id");
