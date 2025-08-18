/*
  Warnings:

  - The primary key for the `usuario_perfil_empresa` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "usuario_perfil_empresa" DROP CONSTRAINT "usuario_perfil_empresa_pkey",
ADD COLUMN     "empresa_id" SERIAL NOT NULL,
ADD CONSTRAINT "usuario_perfil_empresa_pkey" PRIMARY KEY ("empresa_id");
