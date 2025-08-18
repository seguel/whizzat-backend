-- AddForeignKey
ALTER TABLE "usuario_perfil_empresa" ADD CONSTRAINT "usuario_perfil_empresa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil_empresa" ADD CONSTRAINT "usuario_perfil_empresa_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
