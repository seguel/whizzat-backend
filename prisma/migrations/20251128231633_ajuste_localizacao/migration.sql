-- AlterTable
ALTER TABLE "usuario_perfil_avaliador" ALTER COLUMN "localizacao" DROP NOT NULL;

-- AlterTable
ALTER TABLE "usuario_perfil_candidato" ALTER COLUMN "localizacao" DROP NOT NULL;

-- AlterTable
ALTER TABLE "usuario_perfil_recrutador" ALTER COLUMN "localizacao" DROP NOT NULL;
