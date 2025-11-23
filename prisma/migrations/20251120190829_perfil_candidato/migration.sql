-- CreateTable
CREATE TABLE "usuario_perfil_candidato" (
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
    "linguagem" TEXT NOT NULL,

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

-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_candidato_usuario_id_perfil_id_key" ON "usuario_perfil_candidato"("usuario_id", "perfil_id");

-- AddForeignKey
ALTER TABLE "usuario_perfil_candidato" ADD CONSTRAINT "usuario_perfil_candidato_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_candidato" ADD CONSTRAINT "usuario_perfil_candidato_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
