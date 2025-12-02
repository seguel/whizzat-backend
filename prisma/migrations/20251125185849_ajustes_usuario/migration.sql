/*
  Warnings:

  - A unique constraint covering the columns `[estado_id,cidade]` on the table `estado_cidade` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "estado_cidade_estado_id_cidade_key" ON "estado_cidade"("estado_id", "cidade");
