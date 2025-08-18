-- CreateTable
CREATE TABLE "usuario_perfil_empresa" (
    "usuario_id" INTEGER NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "nome_empresa" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "apresentacao" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "imagem_fundo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_perfil_empresa_pkey" PRIMARY KEY ("usuario_id","perfil_id")
);
