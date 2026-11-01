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

  let totalInseridas = 0;
  let totalAtualizadas = 0;
  let totalErros = 0;

  for (const estado of estados) {
    try {
      console.log(`Processando cidades de ${estado.sigla}...`);

      const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado.sigla}/municipios`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro ao consultar IBGE: ${response.status}`);
      }

      const cidadesIBGE = (await response.json()) as CidadeIBGE[];

      // Atualiza as cidades existentes e insere as ausentes.
      // A chave composta evita confundir cidades homônimas de UFs diferentes.
      for (const cidade of cidadesIBGE) {
        try {
          const existente = await prisma.estadoCidade.findUnique({
            where: {
              estado_id_cidade: {
                estado_id: estado.id,
                cidade: cidade.nome,
              },
            },
            select: {
              id: true,
              codigo_ibge: true,
            },
          });

          if (existente) {
            if (existente.codigo_ibge !== String(cidade.id)) {
              await prisma.estadoCidade.update({
                where: { id: existente.id },
                data: {
                  codigo_ibge: String(cidade.id),
                },
              });

              totalAtualizadas++;
            }
          } else {
            await prisma.estadoCidade.create({
              data: {
                estado_id: estado.id,
                cidade: cidade.nome,
                codigo_ibge: String(cidade.id),
                cep: null,
              },
            });

            totalInseridas++;
          }
        } catch (error) {
          totalErros++;
          console.error(
            `Erro ao processar ${cidade.nome}/${estado.sigla}:`,
            error,
          );
        }
      }

      console.log(`UF ${estado.sigla} processada.`);
    } catch (error) {
      totalErros++;
      console.error(`Erro ao consultar cidades de ${estado.sigla}:`, error);
    }
  }

  console.log('Seed finalizado!');
  console.log(`Cidades inseridas: ${totalInseridas}`);
  console.log(`Cidades atualizadas: ${totalAtualizadas}`);
  console.log(`Erros: ${totalErros}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
