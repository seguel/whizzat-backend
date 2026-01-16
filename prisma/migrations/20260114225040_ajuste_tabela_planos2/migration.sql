/*
  Warnings:

  - You are about to drop the column `descricao` on the `plano` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plano" DROP COLUMN "descricao";

-- AlterTable
ALTER TABLE "plano_linguagem" ADD COLUMN     "descricao" TEXT;
