/*
  Warnings:

  - Added the required column `cidade_id` to the `empresa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cidade_id` to the `empresa_vaga` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "empresa" ADD COLUMN     "cidade_id" INTEGER NOT NULL,
ALTER COLUMN "localizacao" DROP NOT NULL;

-- AlterTable
ALTER TABLE "empresa_vaga" ADD COLUMN     "cidade_id" INTEGER NOT NULL,
ALTER COLUMN "local_vaga" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_cidade_id_fkey" FOREIGN KEY ("cidade_id") REFERENCES "estado_cidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_cidade_id_fkey" FOREIGN KEY ("cidade_id") REFERENCES "estado_cidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
