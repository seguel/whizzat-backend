-- AlterTable
ALTER TABLE "usuario_perfil_plano" ADD COLUMN     "pagto_pendente" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "ativo" SET DEFAULT false;

-- CreateTable
CREATE TABLE "plano_pagto_log" (
    "id" SERIAL NOT NULL,
    "usuario_perfil_plano_id" INTEGER NOT NULL,
    "transacao_id" TEXT NOT NULL,
    "data_pagto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "plano_pagto_log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "plano_pagto_log" ADD CONSTRAINT "plano_pagto_log_usuario_perfil_plano_id_fkey" FOREIGN KEY ("usuario_perfil_plano_id") REFERENCES "usuario_perfil_plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
