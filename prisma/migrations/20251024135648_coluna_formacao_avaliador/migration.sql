/*
  Warnings:

  - Added the required column `formacao` to the `avaliador_formacao_academica` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "avaliador_formacao_academica" ADD COLUMN     "formacao" TEXT NOT NULL;
