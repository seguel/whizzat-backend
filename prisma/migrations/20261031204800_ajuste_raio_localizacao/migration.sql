/*
  Warnings:

  - A unique constraint covering the columns `[codigo_ibge]` on the table `estado_cidade` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "estado_cidade" ADD COLUMN     "codigo_ibge" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "estado_cidade_codigo_ibge_key" ON "estado_cidade"("codigo_ibge");
