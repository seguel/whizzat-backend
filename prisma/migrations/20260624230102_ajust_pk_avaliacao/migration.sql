-- DropIndex
DROP INDEX "avaliador_ranking_avaliacao_avaliador_id_avaliacao_skill_id_key";

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_avaliador_id_avaliacao_skill_id_idx" ON "avaliador_ranking_avaliacao"("avaliador_id", "avaliacao_skill_id");
