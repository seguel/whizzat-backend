/*
  Warnings:

  - A unique constraint covering the columns `[vaga_id,candidato_id]` on the table `recrutador_convite_candidato` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "recrutador_convite_candidato_vaga_id_candidato_id_key" ON "recrutador_convite_candidato"("vaga_id", "candidato_id");
