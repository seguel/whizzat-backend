-- CreateIndex
CREATE INDEX "AvaliadorRankingAvaliacao_avaliacao_skill_id_idx" ON "AvaliadorRankingAvaliacao"("avaliacao_skill_id");

-- CreateIndex
CREATE INDEX "AvaliadorRankingAvaliacao_avaliador_id_idx" ON "AvaliadorRankingAvaliacao"("avaliador_id");

-- CreateIndex
CREATE INDEX "AvaliadorRankingAvaliacao_aceite_idx" ON "AvaliadorRankingAvaliacao"("aceite");

-- CreateIndex
CREATE INDEX "AvaliadorRankingAvaliacao_data_expiracao_idx" ON "AvaliadorRankingAvaliacao"("data_expiracao");
