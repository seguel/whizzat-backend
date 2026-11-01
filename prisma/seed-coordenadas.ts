import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const CSV_URL =
  'https://raw.githubusercontent.com/kelvins/Municipios-Brasileiros/main/csv/municipios.csv';

interface CoordenadaMunicipio {
  codigo_ibge: string;
  latitude: number;
  longitude: number;
}

function parseCSV(csv: string): CoordenadaMunicipio[] {
  const linhas = csv.trim().split(/\r?\n/);

  const cabecalho = linhas[0]
    .replace(/^\uFEFF/, '')
    .split(',')
    .map((coluna) => coluna.trim());

  const indexCodigo = cabecalho.indexOf('codigo_ibge');
  const indexLatitude = cabecalho.indexOf('latitude');
  const indexLongitude = cabecalho.indexOf('longitude');

  if (indexCodigo === -1 || indexLatitude === -1 || indexLongitude === -1) {
    throw new Error('CSV não contém codigo_ibge, latitude e longitude.');
  }

  const municipios: CoordenadaMunicipio[] = [];

  for (const linha of linhas.slice(1)) {
    if (!linha.trim()) continue;

    const colunas = linha.split(',');

    const codigo_ibge = colunas[indexCodigo]?.trim();
    const latitudeTexto = colunas[indexLatitude]?.trim();
    const longitudeTexto = colunas[indexLongitude]?.trim();

    if (!codigo_ibge || !latitudeTexto || !longitudeTexto) {
      continue;
    }

    const latitude = Number(latitudeTexto);
    const longitude = Number(longitudeTexto);

    if (
      !/^\d{7}$/.test(codigo_ibge) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      continue;
    }

    municipios.push({
      codigo_ibge,
      latitude,
      longitude,
    });
  }

  return municipios;
}

async function main() {
  console.log('Buscando coordenadas dos municípios...');

  const response = await fetch(CSV_URL);

  if (!response.ok) {
    throw new Error(`Erro ao baixar CSV: HTTP ${response.status}`);
  }

  const csv = await response.text();
  const municipios = parseCSV(csv);

  console.log(`Municípios no CSV: ${municipios.length}`);

  if (municipios.length < 5500) {
    throw new Error('Base geográfica incompleta. Importação cancelada.');
  }

  const mapaCoordenadas = new Map(
    municipios.map((municipio) => [municipio.codigo_ibge, municipio]),
  );

  if (mapaCoordenadas.size !== municipios.length) {
    throw new Error('Foram encontrados códigos IBGE duplicados no CSV.');
  }

  const cidades = await prisma.estadoCidade.findMany({
    select: {
      id: true,
      cidade: true,
      codigo_ibge: true,
      latitude: true,
      longitude: true,
      estado: {
        select: {
          sigla: true,
        },
      },
    },
  });

  let atualizadas = 0;
  let jaPreenchidas = 0;
  let naoEncontradas = 0;
  let erros = 0;

  const pendentes: string[] = [];

  for (const cidade of cidades) {
    const coordenada = cidade.codigo_ibge
      ? mapaCoordenadas.get(cidade.codigo_ibge)
      : undefined;

    if (!coordenada) {
      naoEncontradas++;

      pendentes.push(
        `${cidade.cidade}/${cidade.estado.sigla} - IBGE: ${cidade.codigo_ibge ?? 'NULL'}`,
      );

      continue;
    }

    // Evita atualizações desnecessárias.
    if (
      cidade.latitude === coordenada.latitude &&
      cidade.longitude === coordenada.longitude
    ) {
      jaPreenchidas++;
      continue;
    }

    try {
      await prisma.estadoCidade.update({
        where: {
          id: cidade.id,
        },
        data: {
          latitude: coordenada.latitude,
          longitude: coordenada.longitude,
        },
      });

      atualizadas++;
    } catch (error) {
      erros++;

      console.error(`Erro em ${cidade.cidade}/${cidade.estado.sigla}:`, error);
    }
  }

  console.log('\n========== RESULTADO ==========');
  console.log(`Cidades no banco: ${cidades.length}`);
  console.log(`Coordenadas atualizadas: ${atualizadas}`);
  console.log(`Já preenchidas: ${jaPreenchidas}`);
  console.log(`Não encontradas: ${naoEncontradas}`);
  console.log(`Erros: ${erros}`);

  if (pendentes.length > 0) {
    console.log('\nCidades sem correspondência:');

    for (const pendente of pendentes) {
      console.log(`- ${pendente}`);
    }
  }

  console.log('\nSeed de coordenadas finalizado!');
}

main()
  .catch((error) => {
    console.error('Falha no seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
