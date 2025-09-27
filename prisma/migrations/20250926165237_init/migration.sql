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
    "localizacao" TEXT NOT NULL,
    "apresentacao" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "meio_notificacao" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_perfil_recrutador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_perfil_avaliador" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "empresa_id" INTEGER,
    "telefone" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "apresentacao" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "avaliar_todos" BOOLEAN NOT NULL DEFAULT false,
    "meio_notificacao" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

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
CREATE TABLE "empresa" (
    "id" SERIAL NOT NULL,
    "recrutador_id" INTEGER NOT NULL,
    "nome_empresa" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "apresentacao" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "imagem_fundo" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa_vaga" (
    "vaga_id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "nome_vaga" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "local_vaga" TEXT NOT NULL,
    "modalidade_trabalho_id" INTEGER NOT NULL,
    "periodo_trabalho_id" INTEGER NOT NULL,
    "pcd" BOOLEAN NOT NULL,
    "qtde_dias_aberta" INTEGER NOT NULL,
    "qtde_posicao" INTEGER NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

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
CREATE TABLE "skill" (
    "skill_id" SERIAL NOT NULL,
    "skill" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("skill_id")
);

-- CreateTable
CREATE TABLE "modalidade_trabalho" (
    "modalidade_trabalho_id" SERIAL NOT NULL,
    "modalidade" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL,

    CONSTRAINT "modalidade_trabalho_pkey" PRIMARY KEY ("modalidade_trabalho_id")
);

-- CreateTable
CREATE TABLE "periodo_trabalho" (
    "periodo_trabalho_id" SERIAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL,

    CONSTRAINT "periodo_trabalho_pkey" PRIMARY KEY ("periodo_trabalho_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_recrutador_usuario_id_perfil_id_key" ON "usuario_perfil_recrutador"("usuario_id", "perfil_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_avaliador_usuario_id_perfil_id_key" ON "usuario_perfil_avaliador"("usuario_id", "perfil_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_skill_key" ON "skill"("skill");

-- AddForeignKey
ALTER TABLE "usuario_perfil_recrutador" ADD CONSTRAINT "usuario_perfil_recrutador_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_recrutador" ADD CONSTRAINT "usuario_perfil_recrutador_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_avaliador" ADD CONSTRAINT "usuario_perfil_avaliador_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_avaliador" ADD CONSTRAINT "usuario_perfil_avaliador_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_avaliador" ADD CONSTRAINT "usuario_perfil_avaliador_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_skill" ADD CONSTRAINT "avaliador_skill_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuario_perfil_avaliador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliador_skill" ADD CONSTRAINT "avaliador_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("skill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_recrutador_id_fkey" FOREIGN KEY ("recrutador_id") REFERENCES "usuario_perfil_recrutador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_modalidade_trabalho_id_fkey" FOREIGN KEY ("modalidade_trabalho_id") REFERENCES "modalidade_trabalho"("modalidade_trabalho_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_periodo_trabalho_id_fkey" FOREIGN KEY ("periodo_trabalho_id") REFERENCES "periodo_trabalho"("periodo_trabalho_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga_skill" ADD CONSTRAINT "empresa_vaga_skill_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "empresa_vaga"("vaga_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga_skill" ADD CONSTRAINT "empresa_vaga_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("skill_id") ON DELETE RESTRICT ON UPDATE CASCADE;
