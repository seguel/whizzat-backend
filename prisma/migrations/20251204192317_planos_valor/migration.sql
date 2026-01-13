/*
  Warnings:

  - You are about to alter the column `valor` on the `plano_periodo` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "plano_periodo" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(10,2);
