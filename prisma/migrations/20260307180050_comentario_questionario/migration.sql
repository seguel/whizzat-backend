/*
  Warnings:

  - Added the required column `comentario` to the `avaliador_questionario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "avaliador_questionario" ADD COLUMN     "comentario" TEXT NOT NULL;
