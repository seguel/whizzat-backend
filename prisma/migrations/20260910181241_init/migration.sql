-- CreateEnum
CREATE TYPE "PerfilTipo" AS ENUM ('CANDIDATO', 'RECRUTADOR', 'AVALIADOR');

-- CreateEnum
CREATE TYPE "TipoOportunidade" AS ENUM ('AMPLA_CONCORRENCIA', 'AFIRMATIVA', 'EXCLUSIVA');

-- CreateEnum
CREATE TYPE "PublicoAfirmativo" AS ENUM ('PCD', 'AFIRMATIVA_RACIAL', 'LGBTQIA', 'MULHERES', 'CINQUENTA_MAIS', 'DIVERSIDADE');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('NOVA_SKILL', 'NOVA_MENSAGEM', 'NOVA_AVALIACAO', 'CADASTRO_AVALIADOR', 'NOVA_MENSAGEM_AGENDA', 'NOVA_MENSAGEM_ENTREVISTA', 'NOVA_MENSAGEM_FORMULARIO', 'NOVA_MENSAGEM_FINALIZADA');

-- CreateEnum
CREATE TYPE "TipoPergunta" AS ENUM ('CAIXA_TEXTO', 'ALTERNATIVA', 'MULTIPLA_ESCOLHA');

-- CreateEnum
CREATE TYPE "AgendaStatus" AS ENUM ('PENDENTE', 'ACEITO', 'REALIZADO', 'CANCELADO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "StatusAvaliacao" AS ENUM ('CONVITE_ACEITO', 'QUESTIONARIO_ENVIADO', 'ENTREVISTA_REALIZADA', 'FINALIZADO', 'AGENDA_ENVIADA', 'AGENDADO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "primeiro_nome" TEXT NOT NULL,
    "ultimo_nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "id_perfil" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linguagem" TEXT NOT NULL,
    "cidade_id" INTEGER NOT NULL,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "genero_id" INTEGER NOT NULL,
    "nome_social" TEXT,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil" (
    "id" SERIAL NOT NULL,
    "perfil" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_perfil_recrutador" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "telefone" TEXT NOT NULL,
    "localizacao" TEXT,
    "apresentacao" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "meio_notificacao" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "usuario_perfil_recrutador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_perfil_avaliador" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "empresa_id" INTEGER,
    "telefone" TEXT NOT NULL,
    "localizacao" TEXT,
    "apresentacao" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "avaliar_todos" BOOLEAN NOT NULL DEFAULT false,
    "meio_notificacao" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "status_cadastro" INTEGER NOT NULL DEFAULT -1,
    "data_envio_link" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linguagem" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 10,
    "liberado_avaliar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuario_perfil_avaliador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_skill" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL,
    "favorito" BOOLEAN NOT NULL,
    "tempo_favorito" TEXT NOT NULL,

    CONSTRAINT "avaliador_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_formacao_academica" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "graduacao_id" INTEGER NOT NULL,
    "formacao" TEXT NOT NULL,
    "certificado_file" TEXT NOT NULL,

    CONSTRAINT "avaliador_formacao_academica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_certificacoes" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "certificacao_id" INTEGER NOT NULL,
    "certificado_file" TEXT NOT NULL,

    CONSTRAINT "avaliador_certificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_perfil_candidato" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "telefone" TEXT NOT NULL,
    "localizacao" TEXT,
    "apresentacao" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "meio_notificacao" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "linguagem" TEXT NOT NULL,
    "aberto_oportunidades" BOOLEAN NOT NULL DEFAULT true,
    "oportunidade_50mais" BOOLEAN NOT NULL DEFAULT false,
    "oportunidade_afirmativa_racial" BOOLEAN NOT NULL DEFAULT false,
    "oportunidade_diversidade" BOOLEAN NOT NULL DEFAULT false,
    "oportunidade_lgbtqia" BOOLEAN NOT NULL DEFAULT false,
    "oportunidade_pcd" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuario_perfil_candidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidato_skill" (
    "id" SERIAL NOT NULL,
    "candidato_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL,
    "favorito" BOOLEAN NOT NULL,
    "tempo_favorito" TEXT NOT NULL,
    "data_ultima_avaliacao" TIMESTAMP(3),
    "peso_avaliador" INTEGER,

    CONSTRAINT "candidato_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidato_formacao_academica" (
    "id" SERIAL NOT NULL,
    "candidato_id" INTEGER NOT NULL,
    "graduacao_id" INTEGER NOT NULL,
    "formacao" TEXT NOT NULL,
    "certificado_file" TEXT NOT NULL,

    CONSTRAINT "candidato_formacao_academica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidato_certificacoes" (
    "id" SERIAL NOT NULL,
    "candidato_id" INTEGER NOT NULL,
    "certificacao_id" INTEGER NOT NULL,
    "certificado_file" TEXT NOT NULL,

    CONSTRAINT "candidato_certificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidato_modalidade_trabalho" (
    "candidato_id" INTEGER NOT NULL,
    "modalidade_id" INTEGER NOT NULL,

    CONSTRAINT "candidato_modalidade_trabalho_pkey" PRIMARY KEY ("candidato_id","modalidade_id")
);

-- CreateTable
CREATE TABLE "empresa" (
    "id" SERIAL NOT NULL,
    "recrutador_id" INTEGER NOT NULL,
    "nome_empresa" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "localizacao" TEXT,
    "apresentacao" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "imagem_fundo" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "linguagem" TEXT NOT NULL,
    "cidade_id" INTEGER NOT NULL,

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa_vaga" (
    "vaga_id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "nome_vaga" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "local_vaga" TEXT,
    "modalidade_trabalho_id" INTEGER NOT NULL,
    "periodo_trabalho_id" INTEGER NOT NULL,
    "qtde_dias_aberta" INTEGER NOT NULL,
    "qtde_posicao" INTEGER NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "cidade_id" INTEGER NOT NULL,
    "tipo_oportunidade" "TipoOportunidade" NOT NULL DEFAULT 'AMPLA_CONCORRENCIA',

    CONSTRAINT "empresa_vaga_pkey" PRIMARY KEY ("vaga_id")
);

-- CreateTable
CREATE TABLE "empresa_vaga_skill" (
    "id" SERIAL NOT NULL,
    "vaga_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL,
    "avaliador_proprio" BOOLEAN NOT NULL,

    CONSTRAINT "empresa_vaga_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_skill" (
    "id" SERIAL NOT NULL,
    "tipo_Skill" TEXT NOT NULL,

    CONSTRAINT "tipo_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill" (
    "skill_id" SERIAL NOT NULL,
    "skill" TEXT NOT NULL,
    "tipo_skill_id" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("skill_id")
);

-- CreateTable
CREATE TABLE "modalidade_trabalho" (
    "modalidade_trabalho_id" SERIAL NOT NULL,
    "modalidade" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "linguagem" TEXT NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "modalidade_trabalho_pkey" PRIMARY KEY ("modalidade_trabalho_id")
);

-- CreateTable
CREATE TABLE "periodo_trabalho" (
    "periodo_trabalho_id" SERIAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "periodo_trabalho_pkey" PRIMARY KEY ("periodo_trabalho_id")
);

-- CreateTable
CREATE TABLE "certificacoes" (
    "id" SERIAL NOT NULL,
    "certificado" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "certificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graduacao" (
    "id" SERIAL NOT NULL,
    "graduacao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "graduacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genero" (
    "id" SERIAL NOT NULL,
    "genero" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "genero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estado" (
    "id" SERIAL NOT NULL,
    "estado" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "estado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estado_cidade" (
    "id" SERIAL NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "cidade" TEXT NOT NULL,
    "cep" TEXT,

    CONSTRAINT "estado_cidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano" (
    "id" SERIAL NOT NULL,
    "plano" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "highlight" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_linguagem" (
    "id" SERIAL NOT NULL,
    "plano_id" INTEGER NOT NULL,
    "plano" TEXT NOT NULL,
    "linguagem" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "plano_linguagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_itens" (
    "id" SERIAL NOT NULL,
    "plano_id" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "plano_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_periodo" (
    "id" SERIAL NOT NULL,
    "plano_id" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL,
    "validade_dias" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "perfil_id" INTEGER NOT NULL DEFAULT 0,
    "valor_old" DECIMAL(10,2),
    "desconto" INTEGER,

    CONSTRAINT "plano_periodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_perfil" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "perfil_id" INTEGER NOT NULL,

    CONSTRAINT "usuario_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_perfil_plano" (
    "id" SERIAL NOT NULL,
    "usuario_perfil_id" INTEGER NOT NULL,
    "plano_periodo_id" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagto_pendente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_perfil_plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_pagto_log" (
    "id" SERIAL NOT NULL,
    "usuario_perfil_plano_id" INTEGER NOT NULL,
    "transacao_id" TEXT NOT NULL,
    "data_pagto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "plano_pagto_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidato_avaliacao_skill" (
    "id" SERIAL NOT NULL,
    "candidato_skill_id" INTEGER NOT NULL,
    "data_avaliacao" TIMESTAMP(3),
    "avaliacao_pendente" BOOLEAN NOT NULL DEFAULT true,
    "prioridade_ordem" INTEGER NOT NULL,
    "reavaliar" BOOLEAN NOT NULL DEFAULT false,
    "data_pedido_reavaliar" TIMESTAMP(3),
    "avaliador_id" INTEGER,
    "linguagem" TEXT NOT NULL,
    "tentativas_convite" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "candidato_avaliacao_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_ranking_avaliacao" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "avaliacao_skill_id" INTEGER NOT NULL,
    "data_convite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_expiracao" TIMESTAMP(3) NOT NULL,
    "aceite" BOOLEAN,
    "data_aceite_recusa" TIMESTAMP(3),

    CONSTRAINT "avaliador_ranking_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_avaliacao_skill" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "avaliacao_skill_id" INTEGER NOT NULL,
    "data_avaliacao" TIMESTAMP(3),
    "peso" INTEGER,
    "comentario" TEXT,
    "data_aceite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_resposta_questionario" TIMESTAMP(3),
    "questionario_id" INTEGER,
    "status" "StatusAvaliacao" NOT NULL DEFAULT 'CONVITE_ACEITO',
    "data_envio_formulario" TIMESTAMP(3),
    "comentario_resposta" TEXT,

    CONSTRAINT "avaliador_avaliacao_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "perfil_tipo" "PerfilTipo" NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "referencia_id" INTEGER,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "enviada_email" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_questionario" (
    "id" SERIAL NOT NULL,
    "avaliador_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentario" TEXT,

    CONSTRAINT "avaliador_questionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_questionario_pergunta" (
    "id" SERIAL NOT NULL,
    "questionario_id" INTEGER NOT NULL,
    "pergunta" TEXT NOT NULL,
    "resposta_base" TEXT,
    "tipo_pergunta" "TipoPergunta" NOT NULL DEFAULT 'CAIXA_TEXTO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "avaliador_questionario_pergunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliador_avaliacao_skill_resposta" (
    "id" SERIAL NOT NULL,
    "avaliador_avaliacao_id" INTEGER NOT NULL,
    "questionario_pergunta_id" INTEGER NOT NULL,
    "resposta" TEXT,

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

-- CreateTable
CREATE TABLE "empresa_vaga_publico_afirmativo" (
    "id" SERIAL NOT NULL,
    "vaga_id" INTEGER NOT NULL,
    "codigo" "PublicoAfirmativo" NOT NULL,

    CONSTRAINT "empresa_vaga_publico_afirmativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recrutador_candidato_exclusao" (
    "id" SERIAL NOT NULL,
    "recrutador_id" INTEGER NOT NULL,
    "candidato_id" INTEGER NOT NULL,
    "motivo" TEXT,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recrutador_candidato_exclusao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_recrutador_usuario_id_perfil_id_key" ON "usuario_perfil_recrutador"("usuario_id", "perfil_id");

-- CreateIndex
CREATE INDEX "usuario_perfil_avaliador_ativo_avaliar_todos_liberado_avali_idx" ON "usuario_perfil_avaliador"("ativo", "avaliar_todos", "liberado_avaliar", "linguagem");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_avaliador_usuario_id_perfil_id_key" ON "usuario_perfil_avaliador"("usuario_id", "perfil_id");

-- CreateIndex
CREATE INDEX "avaliador_skill_skill_id_idx" ON "avaliador_skill"("skill_id");

-- CreateIndex
CREATE INDEX "avaliador_formacao_academica_avaliador_id_idx" ON "avaliador_formacao_academica"("avaliador_id");

-- CreateIndex
CREATE INDEX "avaliador_certificacoes_avaliador_id_idx" ON "avaliador_certificacoes"("avaliador_id");

-- CreateIndex
CREATE INDEX "usuario_perfil_candidato_ativo_aberto_oportunidades_idx" ON "usuario_perfil_candidato"("ativo", "aberto_oportunidades");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_candidato_usuario_id_perfil_id_key" ON "usuario_perfil_candidato"("usuario_id", "perfil_id");

-- CreateIndex
CREATE INDEX "candidato_skill_candidato_id_idx" ON "candidato_skill"("candidato_id");

-- CreateIndex
CREATE INDEX "candidato_formacao_academica_candidato_id_idx" ON "candidato_formacao_academica"("candidato_id");

-- CreateIndex
CREATE INDEX "candidato_certificacoes_candidato_id_idx" ON "candidato_certificacoes"("candidato_id");

-- CreateIndex
CREATE INDEX "candidato_modalidade_trabalho_modalidade_id_idx" ON "candidato_modalidade_trabalho"("modalidade_id");

-- CreateIndex
CREATE INDEX "empresa_id_recrutador_id_idx" ON "empresa"("id", "recrutador_id");

-- CreateIndex
CREATE INDEX "empresa_vaga_empresa_id_idx" ON "empresa_vaga"("empresa_id");

-- CreateIndex
CREATE INDEX "empresa_vaga_tipo_oportunidade_idx" ON "empresa_vaga"("tipo_oportunidade");

-- CreateIndex
CREATE INDEX "empresa_vaga_modalidade_trabalho_id_idx" ON "empresa_vaga"("modalidade_trabalho_id");

-- CreateIndex
CREATE INDEX "empresa_vaga_skill_vaga_id_idx" ON "empresa_vaga_skill"("vaga_id");

-- CreateIndex
CREATE INDEX "tipo_skill_id_idx" ON "tipo_skill"("id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_skill_key" ON "skill"("skill");

-- CreateIndex
CREATE INDEX "skill_skill_id_idx" ON "skill"("skill_id");

-- CreateIndex
CREATE INDEX "modalidade_trabalho_linguagem_ativo_idx" ON "modalidade_trabalho"("linguagem", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "modalidade_trabalho_codigo_linguagem_key" ON "modalidade_trabalho"("codigo", "linguagem");

-- CreateIndex
CREATE INDEX "periodo_trabalho_periodo_trabalho_id_idx" ON "periodo_trabalho"("periodo_trabalho_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificacoes_certificado_key" ON "certificacoes"("certificado");

-- CreateIndex
CREATE INDEX "certificacoes_id_idx" ON "certificacoes"("id");

-- CreateIndex
CREATE INDEX "graduacao_id_idx" ON "graduacao"("id");

-- CreateIndex
CREATE INDEX "genero_id_idx" ON "genero"("id");

-- CreateIndex
CREATE INDEX "estado_id_idx" ON "estado"("id");

-- CreateIndex
CREATE UNIQUE INDEX "estado_cidade_estado_id_cidade_key" ON "estado_cidade"("estado_id", "cidade");

-- CreateIndex
CREATE INDEX "plano_id_idx" ON "plano"("id");

-- CreateIndex
CREATE INDEX "plano_linguagem_id_idx" ON "plano_linguagem"("id");

-- CreateIndex
CREATE INDEX "plano_linguagem_plano_id_idx" ON "plano_linguagem"("plano_id");

-- CreateIndex
CREATE INDEX "plano_itens_plano_id_idx" ON "plano_itens"("plano_id");

-- CreateIndex
CREATE INDEX "plano_periodo_plano_id_idx" ON "plano_periodo"("plano_id");

-- CreateIndex
CREATE INDEX "plano_periodo_plano_id_perfil_id_idx" ON "plano_periodo"("plano_id", "perfil_id");

-- CreateIndex
CREATE INDEX "usuario_perfil_usuario_id_idx" ON "usuario_perfil"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_usuario_id_perfil_id_key" ON "usuario_perfil"("usuario_id", "perfil_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_plano_usuario_perfil_id_key" ON "usuario_perfil_plano"("usuario_perfil_id");

-- CreateIndex
CREATE INDEX "usuario_perfil_plano_usuario_perfil_id_idx" ON "usuario_perfil_plano"("usuario_perfil_id");

-- CreateIndex
CREATE UNIQUE INDEX "plano_pagto_log_transacao_id_key" ON "plano_pagto_log"("transacao_id");

-- CreateIndex
CREATE INDEX "plano_pagto_log_usuario_perfil_plano_id_idx" ON "plano_pagto_log"("usuario_perfil_plano_id");

-- CreateIndex
CREATE INDEX "candidato_avaliacao_skill_avaliador_id_idx" ON "candidato_avaliacao_skill"("avaliador_id");

-- CreateIndex
CREATE INDEX "candidato_avaliacao_skill_candidato_skill_id_idx" ON "candidato_avaliacao_skill"("candidato_skill_id");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_avaliador_id_avaliacao_skill_id_idx" ON "avaliador_ranking_avaliacao"("avaliador_id", "avaliacao_skill_id");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_avaliacao_skill_id_idx" ON "avaliador_ranking_avaliacao"("avaliacao_skill_id");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_avaliador_id_idx" ON "avaliador_ranking_avaliacao"("avaliador_id");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_aceite_idx" ON "avaliador_ranking_avaliacao"("aceite");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_data_expiracao_idx" ON "avaliador_ranking_avaliacao"("data_expiracao");

-- CreateIndex
CREATE INDEX "avaliador_ranking_avaliacao_avaliador_id_aceite_idx" ON "avaliador_ranking_avaliacao"("avaliador_id", "aceite");

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
CREATE INDEX "notificacao_usuario_id_perfil_tipo_idx" ON "notificacao"("usuario_id", "perfil_tipo");

-- CreateIndex
CREATE INDEX "notificacao_usuario_id_perfil_tipo_lida_idx" ON "notificacao"("usuario_id", "perfil_tipo", "lida");

-- CreateIndex
CREATE INDEX "notificacao_usuario_id_lida_idx" ON "notificacao"("usuario_id", "lida");

-- CreateIndex
CREATE INDEX "notificacao_enviada_email_idx" ON "notificacao"("enviada_email");

-- CreateIndex
CREATE UNIQUE INDEX "notificacao_perfil_tipo_usuario_id_tipo_referencia_id_titul_key" ON "notificacao"("perfil_tipo", "usuario_id", "tipo", "referencia_id", "titulo");

-- CreateIndex
CREATE INDEX "avaliador_questionario_avaliador_id_ativo_idx" ON "avaliador_questionario"("avaliador_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "avaliador_questionario_avaliador_id_titulo_key" ON "avaliador_questionario"("avaliador_id", "titulo");

-- CreateIndex
CREATE INDEX "avaliador_questionario_pergunta_questionario_id_ativo_idx" ON "avaliador_questionario_pergunta"("questionario_id", "ativo");

-- CreateIndex
CREATE INDEX "avaliador_questionario_pergunta_questionario_id_ordem_idx" ON "avaliador_questionario_pergunta"("questionario_id", "ordem");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_resposta_avaliador_avaliacao_id_q_idx" ON "avaliador_avaliacao_skill_resposta"("avaliador_avaliacao_id", "questionario_pergunta_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliador_avaliacao_skill_resposta_avaliador_avaliacao_id_q_key" ON "avaliador_avaliacao_skill_resposta"("avaliador_avaliacao_id", "questionario_pergunta_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliador_avaliacao_skill_agenda_avaliador_avaliacao_id_key" ON "avaliador_avaliacao_skill_agenda"("avaliador_avaliacao_id");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_agenda_avaliador_avaliacao_id_idx" ON "avaliador_avaliacao_skill_agenda"("avaliador_avaliacao_id");

-- CreateIndex
CREATE INDEX "avaliador_avaliacao_skill_agenda_data_hora_agenda_idx" ON "avaliador_avaliacao_skill_agenda"("data_hora_agenda");

-- CreateIndex
CREATE INDEX "empresa_vaga_publico_afirmativo_vaga_id_idx" ON "empresa_vaga_publico_afirmativo"("vaga_id");

-- CreateIndex
CREATE INDEX "empresa_vaga_publico_afirmativo_codigo_idx" ON "empresa_vaga_publico_afirmativo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_vaga_publico_afirmativo_vaga_id_codigo_key" ON "empresa_vaga_publico_afirmativo"("vaga_id", "codigo");

-- CreateIndex
CREATE INDEX "recrutador_candidato_exclusao_recrutador_id_ativo_idx" ON "recrutador_candidato_exclusao"("recrutador_id", "ativo");

-- CreateIndex
CREATE INDEX "recrutador_candidato_exclusao_candidato_id_idx" ON "recrutador_candidato_exclusao"("candidato_id");

-- CreateIndex
CREATE UNIQUE INDEX "recrutador_candidato_exclusao_recrutador_id_candidato_id_key" ON "recrutador_candidato_exclusao"("recrutador_id", "candidato_id");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_cidade_id_fkey" FOREIGN KEY ("cidade_id") REFERENCES "estado_cidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_genero_id_fkey" FOREIGN KEY ("genero_id") REFERENCES "genero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_recrutador" ADD CONSTRAINT "usuario_perfil_recrutador_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_recrutador" ADD CONSTRAINT "usuario_perfil_recrutador_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_avaliador" ADD CONSTRAINT "usuario_perfil_avaliador_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_avaliador" ADD CONSTRAINT "usuario_perfil_avaliador_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_avaliador" ADD CONSTRAINT "usuario_perfil_avaliador_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_skill" ADD CONSTRAINT "avaliador_skill_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_skill" ADD CONSTRAINT "avaliador_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("skill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_formacao_academica" ADD CONSTRAINT "avaliador_formacao_academica_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_formacao_academica" ADD CONSTRAINT "avaliador_formacao_academica_graduacao_id_fkey" FOREIGN KEY ("graduacao_id") REFERENCES "graduacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_certificacoes" ADD CONSTRAINT "avaliador_certificacoes_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_certificacoes" ADD CONSTRAINT "avaliador_certificacoes_certificacao_id_fkey" FOREIGN KEY ("certificacao_id") REFERENCES "certificacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_candidato" ADD CONSTRAINT "usuario_perfil_candidato_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_candidato" ADD CONSTRAINT "usuario_perfil_candidato_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_skill" ADD CONSTRAINT "candidato_skill_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "usuario_perfil_candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_skill" ADD CONSTRAINT "candidato_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("skill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_formacao_academica" ADD CONSTRAINT "candidato_formacao_academica_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "usuario_perfil_candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_formacao_academica" ADD CONSTRAINT "candidato_formacao_academica_graduacao_id_fkey" FOREIGN KEY ("graduacao_id") REFERENCES "graduacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_certificacoes" ADD CONSTRAINT "candidato_certificacoes_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "usuario_perfil_candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_certificacoes" ADD CONSTRAINT "candidato_certificacoes_certificacao_id_fkey" FOREIGN KEY ("certificacao_id") REFERENCES "certificacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_modalidade_trabalho" ADD CONSTRAINT "candidato_modalidade_trabalho_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "usuario_perfil_candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_modalidade_trabalho" ADD CONSTRAINT "candidato_modalidade_trabalho_modalidade_id_fkey" FOREIGN KEY ("modalidade_id") REFERENCES "modalidade_trabalho"("modalidade_trabalho_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_cidade_id_fkey" FOREIGN KEY ("cidade_id") REFERENCES "estado_cidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_recrutador_id_fkey" FOREIGN KEY ("recrutador_id") REFERENCES "usuario_perfil_recrutador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_cidade_id_fkey" FOREIGN KEY ("cidade_id") REFERENCES "estado_cidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_modalidade_trabalho_id_fkey" FOREIGN KEY ("modalidade_trabalho_id") REFERENCES "modalidade_trabalho"("modalidade_trabalho_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_periodo_trabalho_id_fkey" FOREIGN KEY ("periodo_trabalho_id") REFERENCES "periodo_trabalho"("periodo_trabalho_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga_skill" ADD CONSTRAINT "empresa_vaga_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("skill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga_skill" ADD CONSTRAINT "empresa_vaga_skill_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "empresa_vaga"("vaga_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill" ADD CONSTRAINT "skill_tipo_skill_id_fkey" FOREIGN KEY ("tipo_skill_id") REFERENCES "tipo_skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_cidade" ADD CONSTRAINT "estado_cidade_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_linguagem" ADD CONSTRAINT "plano_linguagem_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_itens" ADD CONSTRAINT "plano_itens_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_periodo" ADD CONSTRAINT "plano_periodo_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil" ADD CONSTRAINT "usuario_perfil_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_plano" ADD CONSTRAINT "usuario_perfil_plano_plano_periodo_id_fkey" FOREIGN KEY ("plano_periodo_id") REFERENCES "plano_periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_plano" ADD CONSTRAINT "usuario_perfil_plano_usuario_perfil_id_fkey" FOREIGN KEY ("usuario_perfil_id") REFERENCES "usuario_perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_pagto_log" ADD CONSTRAINT "plano_pagto_log_usuario_perfil_plano_id_fkey" FOREIGN KEY ("usuario_perfil_plano_id") REFERENCES "usuario_perfil_plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_avaliacao_skill" ADD CONSTRAINT "candidato_avaliacao_skill_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidato_avaliacao_skill" ADD CONSTRAINT "candidato_avaliacao_skill_candidato_skill_id_fkey" FOREIGN KEY ("candidato_skill_id") REFERENCES "candidato_skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_ranking_avaliacao" ADD CONSTRAINT "avaliador_ranking_avaliacao_avaliacao_skill_id_fkey" FOREIGN KEY ("avaliacao_skill_id") REFERENCES "candidato_avaliacao_skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_ranking_avaliacao" ADD CONSTRAINT "avaliador_ranking_avaliacao_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill" ADD CONSTRAINT "avaliador_avaliacao_skill_avaliacao_skill_id_fkey" FOREIGN KEY ("avaliacao_skill_id") REFERENCES "candidato_avaliacao_skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill" ADD CONSTRAINT "avaliador_avaliacao_skill_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_avaliacao_skill" ADD CONSTRAINT "avaliador_avaliacao_skill_questionario_id_fkey" FOREIGN KEY ("questionario_id") REFERENCES "avaliador_questionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "empresa_vaga_publico_afirmativo" ADD CONSTRAINT "empresa_vaga_publico_afirmativo_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "empresa_vaga"("vaga_id") ON DELETE CASCADE ON UPDATE CASCADE;
