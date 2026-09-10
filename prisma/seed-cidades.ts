import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CidadeIBGE {
  id: number;
  nome: string;
}

async function main() {
  // 1️⃣ Pega todos os estados cadastrados
  const estados = await prisma.estado.findMany();

  for (const estado of estados) {
    try {
      console.log(`Populando cidades para o estado ${estado.sigla}...`);

      // 2️⃣ Chama a API do IBGE
      const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado.sigla}/municipios`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro ao consultar IBGE: ${response.status}`);
      }

      const cidadesIBGE = (await response.json()) as CidadeIBGE[];

      // 3️⃣ Prepara dados para inserir
      const cidadesData = cidadesIBGE.map((c) => ({
        estado_id: estado.id,
        cidade: c.nome,
        cep: null,
      }));

      // 4️⃣ Inserção
      if (cidadesData.length > 0) {
        await prisma.estado_cidade.createMany({
          data: cidadesData,
          skipDuplicates: true, // evita duplicações
        });
      }

      console.log(
        `✅ ${cidadesData.length} cidades inseridas para o estado ${estado.sigla}`,
      );
    } catch (error) {
      console.error(`❌ Erro ao popular cidades para ${estado.sigla}:`, error);
    }
  }

  console.log('🎉 Seed finalizado!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
