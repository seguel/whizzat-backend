/*
  Warnings:

  - Added the required column `cidade_id` to the `usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data_nascimento` to the `usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genero_id` to the `usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "cidade_id" INTEGER NOT NULL,
ADD COLUMN     "data_nascimento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "genero_id" INTEGER NOT NULL,
ADD COLUMN     "nome_social" TEXT;

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

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_genero_id_fkey" FOREIGN KEY ("genero_id") REFERENCES "genero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_cidade_id_fkey" FOREIGN KEY ("cidade_id") REFERENCES "estado_cidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_cidade" ADD CONSTRAINT "estado_cidade_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
