/*
  Warnings:

  - A unique constraint covering the columns `[avaliador_id,avaliacao_skill_id]` on the table `avaliador_avaliacao_skill` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TipoPergunta" AS ENUM ('CAIXA_TEXTO', 'ALTERNATIVA', 'MULTIPLA_ESCOLHA');

-- CreateEnum
CREATE TYPE "AgendaStatus" AS ENUM ('PENDENTE', 'ACEITO', 'REALIZADO', 'CANCELADO');

-- DropForeignKey
ALTER TABLE "avaliador_avaliacao_skill" DROP CONSTRAINT "avaliador_avaliacao_skill_avaliacao_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "avaliador_avaliacao_skill" DROP CONSTRAINT "avaliador_avaliacao_skill_avaliador_id_fkey";

-- AlterTable
ALTER TABLE "avaliador_avaliacao_skill" ADD COLUMN     "data_resposta_questionario" TIMESTAMP(3),
ADD COLUMN     "questionario_id" INTEGER;

-- CreateTable
CREATE TABLE "avaliador_questionario" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliador_questionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_questionario_pergunta" (
    "id" SERIAL NOT NULL,
    "questionario_id" INTEGER NOT NULL,
    "pergunta" TEXT NOT NULL,
    "resposta_base" TEXT NOT NULL,
    "tipo_pergunta" "TipoPergunta" NOT NULL DEFAULT 'CAIXA_TEXTO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "avaliador_questionario_pergunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_avaliacao_skill_resposta" (
    "id" SERIAL NOT NULL,
    "avaliador_avaliacao_id" INTEGER NOT NULL,
    "questionario_pergunta_id" INTEGER NOT NULL,
    "resposta" TEXT NOT NULL,

    CONSTRAINT "avaliador_avaliacao_skill_resposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_avaliacao_skill_agenda" (
    "id" SERIAL NOT NULL,
    "avaliador_avaliacao_id" INTEGER NOT NULL,
    "data_hora_agenda" TIMESTAMP(3) NOT NULL,
    "status" "AgendaStatus" NOT NULL DEFAULT 'PENDENTE',
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliador_avaliacao_skill_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avaliador_questionario_avaliador_id_ativo_idx" ON "avaliador_questionario"("avaliador_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "avaliador_questionario_avaliador_id_titulo_key" ON "avaliador_questionario"("avaliador_id", "titulo");

-- CreateIndex
CREATE INDEX "avaliador_questionario_pergunta_questionario_id_ativo_idx" ON "avaliador_questionario_pergunta"("questionario_id", "ativo");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_resposta_avaliador_avaliacao_id_q_idx" ON "avaliador_avaliacao_skill_resposta"("avaliador_avaliacao_id", "questionario_pergunta_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliador_avaliacao_skill_resposta_avaliador_avaliacao_id_q_key" ON "avaliador_avaliacao_skill_resposta"("avaliador_avaliacao_id", "questionario_pergunta_id");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_agenda_avaliador_avaliacao_id_idx" ON "avaliador_avaliacao_skill_agenda"("avaliador_avaliacao_id");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_agenda_data_hora_agenda_idx" ON "avaliador_avaliacao_skill_agenda"("data_hora_agenda");

-- CreateIndex
CREATE UNIQUE INDEX "avaliador_avaliacao_skill_agenda_avaliador_avaliacao_id_key" ON "avaliador_avaliacao_skill_agenda"("avaliador_avaliacao_id");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_avaliador_id_idx" ON "avaliador_avaliacao_skill"("avaliador_id");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_avaliacao_skill_id_idx" ON "avaliador_avaliacao_skill"("avaliacao_skill_id");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_avaliador_id_data_avaliacao_idx" ON "avaliador_avaliacao_skill"("avaliador_id", "data_avaliacao");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_questionario_id_idx" ON "avaliador_avaliacao_skill"("questionario_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliador_avaliacao_skill_avaliador_id_avaliacao_skill_id_key" ON "avaliador_avaliacao_skill"("avaliador_id", "avaliacao_skill_id");

-- CreateIndex
CREATE INDEX "avaliador_certificacoes_avaliador_id_idx" ON "avaliador_certificacoes"("avaliador_id");

-- CreateIndex
CREATE INDEX "avaliador_formacao_academica_avaliador_id_idx" ON "avaliador_formacao_academica"("avaliador_id");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_avaliador_id_aceite_idx" ON "avaliador_ranking_avaliacao"("avaliador_id", "aceite");

-- CreateIndex
CREATE INDEX "candidato_avaliacao_skill_avaliador_id_idx" ON "candidato_avaliacao_skill"("avaliador_id");

-- CreateIndex
CREATE INDEX "candidato_avaliacao_skill_candidato_skill_id_idx" ON "candidato_avaliacao_skill"("candidato_skill_id");

-- CreateIndex
CREATE INDEX "candidato_certificacoes_candidato_id_idx" ON "candidato_certificacoes"("candidato_id");

-- CreateIndex
CREATE INDEX "candidato_formacao_academica_candidato_id_idx" ON "candidato_formacao_academica"("candidato_id");

-- CreateIndex
CREATE INDEX "candidato_skill_candidato_id_idx" ON "candidato_skill"("candidato_id");

-- CreateIndex
CREATE INDEX "certificacoes_id_idx" ON "certificacoes"("id");

-- CreateIndex
CREATE INDEX "empresa_id_recrutador_id_idx" ON "empresa"("id", "recrutador_id");

-- CreateIndex
CREATE INDEX "empresa_vaga_empresa_id_idx" ON "empresa_vaga"("empresa_id");

-- CreateIndex
CREATE INDEX "empresa_vaga_skill_vaga_id_idx" ON "empresa_vaga_skill"("vaga_id");

-- CreateIndex
CREATE INDEX "estado_id_idx" ON "estado"("id");

-- CreateIndex
CREATE INDEX "genero_id_idx" ON "genero"("id");

-- CreateIndex
CREATE INDEX "graduacao_id_idx" ON "graduacao"("id");

-- CreateIndex
CREATE INDEX "modalidade_trabalho_modalidade_trabalho_id_idx" ON "modalidade_trabalho"("modalidade_trabalho_id");

-- CreateIndex
CREATE INDEX "periodo_trabalho_periodo_trabalho_id_idx" ON "periodo_trabalho"("periodo_trabalho_id");

-- CreateIndex
CREATE INDEX "plano_id_idx" ON "plano"("id");

-- CreateIndex
CREATE INDEX "plano_itens_plano_id_idx" ON "plano_itens"("plano_id");

-- CreateIndex
CREATE INDEX "plano_linguagem_id_idx" ON "plano_linguagem"("id");

-- CreateIndex
CREATE INDEX "plano_linguagem_plano_id_idx" ON "plano_linguagem"("plano_id");

-- CreateIndex
CREATE INDEX "plano_pagto_log_usuario_perfil_plano_id_idx" ON "plano_pagto_log"("usuario_perfil_plano_id");

-- CreateIndex
CREATE INDEX "plano_periodo_plano_id_idx" ON "plano_periodo"("plano_id");

-- CreateIndex
CREATE INDEX "plano_periodo_plano_id_perfil_id_idx" ON "plano_periodo"("plano_id", "perfil_id");

-- CreateIndex
CREATE INDEX "skill_skill_id_idx" ON "skill"("skill_id");

-- CreateIndex
CREATE INDEX "tipo_skill_id_idx" ON "tipo_skill"("id");

-- CreateIndex
CREATE INDEX "usuario_perfil_usuario_id_idx" ON "usuario_perfil"("usuario_id");

-- CreateIndex
CREATE INDEX "usuario_perfil_plano_usuario_perfil_id_idx" ON "usuario_perfil_plano"("usuario_perfil_id");

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill" ADD CONSTRAINT "avaliador_avaliacao_skill_avaliacao_skill_id_fkey" FOREIGN KEY ("avaliacao_skill_id") REFERENCES "candidato_avaliacao_skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill" ADD CONSTRAINT "avaliador_avaliacao_skill_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill" ADD CONSTRAINT "avaliador_avaliacao_skill_questionario_id_fkey" FOREIGN KEY ("questionario_id") REFERENCES "avaliador_questionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_questionario" ADD CONSTRAINT "avaliador_questionario_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_questionario_pergunta" ADD CONSTRAINT "avaliador_questionario_pergunta_questionario_id_fkey" FOREIGN KEY ("questionario_id") REFERENCES "avaliador_questionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill_resposta" ADD CONSTRAINT "avaliador_avaliacao_skill_resposta_avaliador_avaliacao_id_fkey" FOREIGN KEY ("avaliador_avaliacao_id") REFERENCES "avaliador_avaliacao_skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill_resposta" ADD CONSTRAINT "avaliador_avaliacao_skill_resposta_questionario_pergunta_i_fkey" FOREIGN KEY ("questionario_pergunta_id") REFERENCES "avaliador_questionario_pergunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill_agenda" ADD CONSTRAINT "avaliador_avaliacao_skill_agenda_avaliador_avaliacao_id_fkey" FOREIGN KEY ("avaliador_avaliacao_id") REFERENCES "avaliador_avaliacao_skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
