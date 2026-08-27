/*
  Warnings:

  - You are about to drop the column `cinquenta_mais` on the `empresa_vaga` table. All the data in the column will be lost.
  - You are about to drop the column `lgbtq` on the `empresa_vaga` table. All the data in the column will be lost.
  - You are about to drop the column `mulheres` on the `empresa_vaga` table. All the data in the column will be lost.
  - You are about to drop the column `pcd` on the `empresa_vaga` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoOportunidade" AS ENUM ('AMPLA_CONCORRENCIA', 'AFIRMATIVA', 'EXCLUSIVA');

-- CreateEnum
CREATE TYPE "PublicoAfirmativo" AS ENUM ('PCD', 'AFIRMATIVA_RACIAL', 'LGBTQIA', 'MULHERES', 'CINQUENTA_MAIS', 'DIVERSIDADE');

-- AlterTable
ALTER TABLE "empresa_vaga" DROP COLUMN "cinquenta_mais",
DROP COLUMN "lgbtq",
DROP COLUMN "mulheres",
DROP COLUMN "pcd",
ADD COLUMN     "tipo_oportunidade" "TipoOportunidade" NOT NULL DEFAULT 'AMPLA_CONCORRENCIA';

-- CreateTable
CREATE TABLE "empresa_vaga_publico_afirmativo" (
    "id" SERIAL NOT NULL,
    "vaga_id" INTEGER NOT NULL,
    "codigo" "PublicoAfirmativo" NOT NULL,

    CONSTRAINT "empresa_vaga_publico_afirmativo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "empresa_vaga_publico_afirmativo_vaga_id_idx" ON "empresa_vaga_publico_afirmativo"("vaga_id");

-- CreateIndex
CREATE INDEX "empresa_vaga_publico_afirmativo_codigo_idx" ON "empresa_vaga_publico_afirmativo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_vaga_publico_afirmativo_vaga_id_codigo_key" ON "empresa_vaga_publico_afirmativo"("vaga_id", "codigo");

-- CreateIndex
CREATE INDEX "empresa_vaga_tipo_oportunidade_idx" ON "empresa_vaga"("tipo_oportunidade");

-- CreateIndex
CREATE INDEX "empresa_vaga_modalidade_trabalho_id_idx" ON "empresa_vaga"("modalidade_trabalho_id");

-- AddForeignKey
ALTER TABLE "empresa_vaga_publico_afirmativo" ADD CONSTRAINT "empresa_vaga_publico_afirmativo_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "empresa_vaga"("vaga_id") ON DELETE CASCADE ON UPDATE CASCADE;
