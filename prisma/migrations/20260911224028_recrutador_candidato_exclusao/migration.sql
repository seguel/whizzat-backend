-- AddForeignKey
ALTER TABLE "recrutador_candidato_exclusao" ADD CONSTRAINT "recrutador_candidato_exclusao_recrutador_id_fkey" FOREIGN KEY ("recrutador_id") REFERENCES "usuario_perfil_recrutador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recrutador_candidato_exclusao" ADD CONSTRAINT "recrutador_candidato_exclusao_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "usuario_perfil_candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
