-- CreateTable
CREATE TABLE "plano_itens" (
    "id" SERIAL NOT NULL,
    "plano_id" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "plano_itens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "plano_itens" ADD CONSTRAINT "plano_itens_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
