-- CreateTable
CREATE TABLE "perfil" (
    "id" SERIAL NOT NULL,
    "perfil" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id")
);
