-- AlterTable
ALTER TABLE "usuario_perfil_candidato" ADD COLUMN     "oportunidade_50mais" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oportunidade_afirmativa_racial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oportunidade_diversidade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oportunidade_lgbtqia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oportunidade_pcd" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "usuario_perfil_candidato_ativo_aberto_oportunidades_idx" ON "usuario_perfil_candidato"("ativo", "aberto_oportunidades");
