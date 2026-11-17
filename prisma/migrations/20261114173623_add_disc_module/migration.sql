-- CreateEnum
CREATE TYPE "DiscDimensao" AS ENUM ('D', 'I', 'S', 'C');

-- CreateEnum
CREATE TYPE "DiscStatusAplicacao" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "disc_questionario" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disc_questionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disc_pergunta" (
    "id" SERIAL NOT NULL,
    "questionario_id" INTEGER NOT NULL,
    "numero_bloco" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "disc_pergunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disc_alternativa" (
    "id" SERIAL NOT NULL,
    "pergunta_id" INTEGER NOT NULL,
    "letra" VARCHAR(1) NOT NULL,
    "texto" TEXT NOT NULL,
    "dimensao" "DiscDimensao" NOT NULL,
    "peso" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "disc_alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidato_disc_aplicacao" (
    "id" SERIAL NOT NULL,
    "candidato_id" INTEGER NOT NULL,
    "questionario_id" INTEGER NOT NULL,
    "status" "DiscStatusAplicacao" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "consentimento" BOOLEAN NOT NULL DEFAULT false,
    "consentimento_em" TIMESTAMP(3),
    "compartilhar_recrutador" BOOLEAN NOT NULL DEFAULT false,
    "iniciado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_em" TIMESTAMP(3),
    "tempo_total_ms" INTEGER NOT NULL DEFAULT 0,
    "tempo_medio_ms" INTEGER,
    "bloco_mais_rapido" INTEGER,
    "bloco_mais_lento" INTEGER,
    "score_d" INTEGER,
    "score_i" INTEGER,
    "score_s" INTEGER,
    "score_c" INTEGER,
    "dimensao_dominante" "DiscDimensao",
    "dimensao_secundaria" "DiscDimensao",
    "blend_codigo" VARCHAR(2),
    "blend_titulo" VARCHAR(150),
    "alerta_tempo" VARCHAR(50),
    "algoritmo_versao" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "candidato_disc_aplicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidato_disc_resposta" (
    "id" SERIAL NOT NULL,
    "aplicacao_id" INTEGER NOT NULL,
    "pergunta_id" INTEGER NOT NULL,
    "alternativa_mais_id" INTEGER NOT NULL,
    "alternativa_menos_id" INTEGER NOT NULL,
    "tempo_ms" INTEGER NOT NULL DEFAULT 0,
    "respondido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidato_disc_resposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disc_questionario_versao_key" ON "disc_questionario"("versao");

-- CreateIndex
CREATE UNIQUE INDEX "disc_pergunta_questionario_id_numero_bloco_key" ON "disc_pergunta"("questionario_id", "numero_bloco");

-- CreateIndex
CREATE UNIQUE INDEX "disc_alternativa_pergunta_id_letra_key" ON "disc_alternativa"("pergunta_id", "letra");

-- CreateIndex
CREATE INDEX "candidato_disc_aplicacao_candidato_id_status_idx" ON "candidato_disc_aplicacao"("candidato_id", "status");

-- CreateIndex
CREATE INDEX "candidato_disc_aplicacao_questionario_id_idx" ON "candidato_disc_aplicacao"("questionario_id");

-- CreateIndex
CREATE INDEX "candidato_disc_resposta_pergunta_id_idx" ON "candidato_disc_resposta"("pergunta_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidato_disc_resposta_aplicacao_id_pergunta_id_key" ON "candidato_disc_resposta"("aplicacao_id", "pergunta_id");

-- AddForeignKey
ALTER TABLE "disc_pergunta" ADD CONSTRAINT "disc_pergunta_questionario_id_fkey" FOREIGN KEY ("questionario_id") REFERENCES "disc_questionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disc_alternativa" ADD CONSTRAINT "disc_alternativa_pergunta_id_fkey" FOREIGN KEY ("pergunta_id") REFERENCES "disc_pergunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_disc_aplicacao" ADD CONSTRAINT "candidato_disc_aplicacao_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "usuario_perfil_candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_disc_aplicacao" ADD CONSTRAINT "candidato_disc_aplicacao_questionario_id_fkey" FOREIGN KEY ("questionario_id") REFERENCES "disc_questionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_disc_resposta" ADD CONSTRAINT "candidato_disc_resposta_aplicacao_id_fkey" FOREIGN KEY ("aplicacao_id") REFERENCES "candidato_disc_aplicacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_disc_resposta" ADD CONSTRAINT "candidato_disc_resposta_pergunta_id_fkey" FOREIGN KEY ("pergunta_id") REFERENCES "disc_pergunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_disc_resposta" ADD CONSTRAINT "candidato_disc_resposta_alternativa_mais_id_fkey" FOREIGN KEY ("alternativa_mais_id") REFERENCES "disc_alternativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_disc_resposta" ADD CONSTRAINT "candidato_disc_resposta_alternativa_menos_id_fkey" FOREIGN KEY ("alternativa_menos_id") REFERENCES "disc_alternativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
