/*
  Warnings:

  - A unique constraint covering the columns `[transacao_id]` on the table `plano_pagto_log` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "plano_pagto_log_transacao_id_key" ON "plano_pagto_log"("transacao_id");
