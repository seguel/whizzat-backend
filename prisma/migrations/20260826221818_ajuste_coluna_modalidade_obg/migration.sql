/*
  Warnings:

  - Made the column `codigo` on table `modalidade_trabalho` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "modalidade_trabalho" ALTER COLUMN "codigo" SET NOT NULL;
