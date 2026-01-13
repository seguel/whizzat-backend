/*
  Warnings:

  - A unique constraint covering the columns `[usuario_perfil_id]` on the table `usuario_perfil_plano` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "usuario_perfil_plano_usuario_perfil_id_key" ON "usuario_perfil_plano"("usuario_perfil_id");
