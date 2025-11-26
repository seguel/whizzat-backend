import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class EstadoService {
  constructor(private readonly prisma: PrismaService) {}

  async getEstados(language: string) {
    return this.prisma.estado.findMany({
      where: { linguagem: language },
      orderBy: {
        estado: 'asc', // ou 'desc'
      },
    });
  }

  async getEstado(id: number) {
    return this.prisma.estado.findUnique({
      where: { id: id },
    });
  }

  async gerarCidades(estadoId: number, uf: string) {
    // 1️⃣ Chama a API do IBGE
    interface CidadeIBGE {
      id: number;
      nome: string;
      microrregiao?: any;
      mesorregiao?: any;
      // pode adicionar outros campos se precisar
    }

    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`;
    const response = await axios.get<CidadeIBGE[]>(url); // <CidadeIBGE[]> tipa o retorno
    const cidadesIBGE: CidadeIBGE[] = response.data;

    // 2️⃣ Prepara os dados para bulk create
    const cidadesData = cidadesIBGE.map((c) => ({
      estado_id: estadoId,
      cidade: c.nome,
      cep: null, // ainda não temos
    }));

    // 3️⃣ Insere no banco usando upsert (evita duplicados)
    for (const c of cidadesData) {
      await this.prisma.estado_cidade.upsert({
        where: {
          estado_id_cidade: {
            estado_id: c.estado_id,
            cidade: c.cidade,
          },
        },
        update: {},
        create: c,
      });
    }

    // 4️⃣ Retorna as cidades inseridas
    return this.prisma.estado_cidade.findMany({
      where: { estado_id: estadoId },
    });
  }
}
