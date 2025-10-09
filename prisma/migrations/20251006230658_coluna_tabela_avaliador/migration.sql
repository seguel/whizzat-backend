/*
  Warnings:

  - You are about to drop the column `cadastro_liberado` on the `usuario_perfil_avaliador` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usuario_perfil_avaliador" DROP COLUMN "cadastro_liberado",
ADD COLUMN     "status_cadastro" INTEGER NOT NULL DEFAULT -1;
