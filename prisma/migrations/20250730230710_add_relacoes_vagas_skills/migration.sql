-- CreateTable
CREATE TABLE "empresa_vaga" (
    "vaga_id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "nome_vaga" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "local_vaga" TEXT NOT NULL,
    "modalidade_trabalho_id" INTEGER NOT NULL,
    "periodo_trabalho_id" INTEGER NOT NULL,
    "pcd" BOOLEAN NOT NULL,
    "qtde_dias_aberta" INTEGER NOT NULL,
    "qtde_posicao" INTEGER NOT NULL,

    CONSTRAINT "empresa_vaga_pkey" PRIMARY KEY ("vaga_id")
);

-- CreateTable
CREATE TABLE "empresa_vaga_skill" (
    "id" SERIAL NOT NULL,
    "vaga_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL,
    "avaliador_proprio" BOOLEAN NOT NULL,

    CONSTRAINT "empresa_vaga_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill" (
    "skill_id" SERIAL NOT NULL,
    "skill" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("skill_id")
);

-- CreateTable
CREATE TABLE "modalidade_trabalho" (
    "modalidade_trabalho_id" SERIAL NOT NULL,
    "modalidade" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL,

    CONSTRAINT "modalidade_trabalho_pkey" PRIMARY KEY ("modalidade_trabalho_id")
);

-- CreateTable
CREATE TABLE "periodo_trabalho" (
    "periodo_trabalho_id" SERIAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL,

    CONSTRAINT "periodo_trabalho_pkey" PRIMARY KEY ("periodo_trabalho_id")
);

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_modalidade_trabalho_id_fkey" FOREIGN KEY ("modalidade_trabalho_id") REFERENCES "modalidade_trabalho"("modalidade_trabalho_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_periodo_trabalho_id_fkey" FOREIGN KEY ("periodo_trabalho_id") REFERENCES "periodo_trabalho"("periodo_trabalho_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga" ADD CONSTRAINT "empresa_vaga_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "usuario_perfil_empresa"("empresa_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga_skill" ADD CONSTRAINT "empresa_vaga_skill_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "empresa_vaga"("vaga_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_vaga_skill" ADD CONSTRAINT "empresa_vaga_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("skill_id") ON DELETE RESTRICT ON UPDATE CASCADE;
