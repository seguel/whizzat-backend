/*
  Warnings:

  - You are about to drop the column `linguagem` on the `plano` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plano" DROP COLUMN "linguagem";

-- CreateTable
CREATE TABLE "plano_linguagem" (
    "id" SERIAL NOT NULL,
    "plano_id" INTEGER NOT NULL,
    "plano" TEXT NOT NULL,
    "linguagem" TEXT NOT NULL,

    CONSTRAINT "plano_linguagem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "plano_linguagem" ADD CONSTRAINT "plano_linguagem_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
