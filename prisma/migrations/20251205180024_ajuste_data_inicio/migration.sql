/*
  Warnings:

  - Changed the type of `data_inicio` on the `usuario_perfil_plano` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "usuario_perfil_plano" DROP COLUMN "data_inicio",
ADD COLUMN     "data_inicio" TIMESTAMP(3) NOT NULL;
