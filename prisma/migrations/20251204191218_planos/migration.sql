-- CreateTable
CREATE TABLE "plano" (
    "id" SERIAL NOT NULL,
    "plano" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_periodo" (
    "id" SERIAL NOT NULL,
    "plano_id" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL,
    "validade_dias" INTEGER NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

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
    "data_inicio" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_perfil_plano_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_usuario_id_perfil_id_key" ON "usuario_perfil"("usuario_id", "perfil_id");

-- AddForeignKey
ALTER TABLE "plano_periodo" ADD CONSTRAINT "plano_periodo_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil" ADD CONSTRAINT "usuario_perfil_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_plano" ADD CONSTRAINT "usuario_perfil_plano_usuario_perfil_id_fkey" FOREIGN KEY ("usuario_perfil_id") REFERENCES "usuario_perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_plano" ADD CONSTRAINT "usuario_perfil_plano_plano_periodo_id_fkey" FOREIGN KEY ("plano_periodo_id") REFERENCES "plano_periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
