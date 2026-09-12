import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

interface CidadeIBGE {
  id: number;
  nome: string;
}

async function main() {
  const estados = await prisma.estado.findMany();

  for (const estado of estados) {
    try {
      console.log(`Populando cidades para o estado ${estado.sigla}...`);

      const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado.sigla}/municipios`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro ao consultar IBGE: ${response.status}`);
      }

      const cidadesIBGE = (await response.json()) as CidadeIBGE[];

      const cidadesData = cidadesIBGE.map((c) => ({
        estado_id: estado.id,
        cidade: c.nome,
        cep: null,
      }));

      if (cidadesData.length > 0) {
        await prisma.estadoCidade.createMany({
          data: cidadesData,
          skipDuplicates: true,
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
