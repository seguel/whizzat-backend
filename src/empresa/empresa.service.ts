import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmpresaService {
  constructor(private readonly prisma: PrismaService) {}

  async createEmpresa(data: {
    usuario_id: number;
    perfil_id: number;
    recrutador_id: number;
    nome_empresa: string;
    website: string;
    email: string;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    logo: string;
    imagem_fundo: string;
    linguagem: string;
    cidade_id: number;
  }) {
    const domíniosPublicos = [
      'gmail.com',
      'hotmail.com',
      'outlook.com',
      'yahoo.com',
      'icloud.com',
      'bol.com.br',
      'uol.com.br',
      'live.com',
      'aol.com',
      'msn.com',
      // adicione outros conforme necessário
    ];

    // --- Regra 1: verificar domínio do email ---
    const emailDomain = data.email.split('@')[1]?.toLowerCase();

    if (emailDomain && !domíniosPublicos.includes(emailDomain)) {
      const emailConflict = await this.prisma.empresa.findFirst({
        where: {
          email: {
            endsWith: `@${emailDomain}`,
          },
        },
      });

      if (emailConflict) {
        throw new BadRequestException(
          `Já existe uma empresa cadastrada com o domínio de email "${emailDomain}".`,
        );
      }
    }

    // --- Regra 2: verificar domínio do website ---
    const normalizeWebsite = (url: string) =>
      url
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .toLowerCase();

    const websiteBase = normalizeWebsite(data.website);

    if (
      websiteBase &&
      !domíniosPublicos.some((dom) => websiteBase.endsWith(dom))
    ) {
      const websiteConflict = await this.prisma.empresa.findFirst({
        where: {
          website: {
            contains: websiteBase,
            mode: 'insensitive',
          },
        },
      });

      if (websiteConflict) {
        throw new BadRequestException(
          `Já existe uma empresa cadastrada com o domínio de website "${websiteBase}".`,
        );
      }
    }

    //Valida se o recrutador_id corresponde ao usuario/perfil
    const validaRecrutador =
      await this.prisma.usuarioPerfilRecrutador.findFirst({
        where: {
          usuario_id: data.usuario_id,
          perfil_id: data.perfil_id,
          id: data.recrutador_id,
        },
      });

    if (!validaRecrutador) {
      throw new BadRequestException(`Dados do recrutador inválidos.`);
    }

    const createData: Prisma.EmpresaCreateInput = {
      recrutador: {
        connect: { id: data.recrutador_id },
      },
      nome_empresa: data.nome_empresa,
      website: data.website,
      email: data.email,
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      logo: data.logo ?? '',
      imagem_fundo: data.imagem_fundo ?? '',
      linguagem: data.linguagem ?? 'pt',
      cidade: {
        connect: { id: data.cidade_id },
      },
    };
    /* 
    // adiciona só se existir
    if (data.logo) createData.logo = data.logo;
    if (data.imagem_fundo) createData.imagem_fundo = data.imagem_fundo; */

    // --- Criação ---
    return this.prisma.empresa.create({
      data: createData,
    });
  }

  async updateEmpresa(data: {
    recrutador_id: number;
    empresa_id: number;
    perfil_id: number;
    nome_empresa: string;
    website: string;
    email: string;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    logo?: string;
    imagem_fundo?: string;
    ativo: boolean;
    cidade_id: number;
  }) {
    const domíniosPublicos = [
      'gmail.com',
      'hotmail.com',
      'outlook.com',
      'yahoo.com',
      'icloud.com',
      'bol.com.br',
      'uol.com.br',
      'live.com',
      'aol.com',
      'msn.com',
    ];

    // --- Regra 1: verificar domínio do email ---
    const emailDomain = data.email.split('@')[1]?.toLowerCase();
    if (emailDomain && !domíniosPublicos.includes(emailDomain)) {
      const emailConflict = await this.prisma.empresa.findFirst({
        where: {
          email: { endsWith: `@${emailDomain}` },
          NOT: { id: data.empresa_id },
        },
      });
      if (emailConflict) {
        throw new BadRequestException(
          `Já existe uma empresa cadastrada com o domínio de email "${emailDomain}".`,
        );
      }
    }

    // --- Regra 2: verificar domínio do website ---
    const normalizeWebsite = (url: string) =>
      url
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .toLowerCase();

    const websiteBase = normalizeWebsite(data.website);
    if (
      websiteBase &&
      !domíniosPublicos.some((dom) => websiteBase.endsWith(dom))
    ) {
      const websiteConflict = await this.prisma.empresa.findFirst({
        where: {
          website: { contains: websiteBase, mode: 'insensitive' },
          NOT: { id: data.empresa_id },
        },
      });
      if (websiteConflict) {
        throw new BadRequestException(
          `Já existe uma empresa cadastrada com o domínio de website "${websiteBase}".`,
        );
      }
    }

    const updateData: Prisma.EmpresaUpdateInput = {
      nome_empresa: data.nome_empresa,
      website: data.website,
      email: data.email,
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      ativo: data.ativo,
      cidade: {
        connect: { id: data.cidade_id },
      },
    };

    // adiciona só se existir
    if (data.logo) updateData.logo = data.logo;
    if (data.imagem_fundo) updateData.imagem_fundo = data.imagem_fundo;

    return this.prisma.empresa.update({
      where: {
        recrutador_id: data.recrutador_id,
        id: data.empresa_id,
      },
      data: updateData,
    });
  }

  async getEmpresasRecrutador(
    recrutadorId: number,
    usuarioId: number,
  ): Promise<{ usuario_id: number; empresas: any[] }> {
    const empresas = await this.prisma.empresa.findMany({
      where: {
        recrutador_id: recrutadorId,
        /* recrutador: {
          usuario_id: usuarioId,
          perfil_id: perfilId,
        }, */
      },
      orderBy: {
        nome_empresa: 'asc',
      },
    });

    return {
      usuario_id: usuarioId,
      empresas, // se não houver nada, retorna []
    };
  }

  async getEmpresas(lang: string): Promise<{ empresas: any[] }> {
    const empresas = await this.prisma.empresa.findMany({
      where: {
        ativo: true,
        linguagem: lang,
      },
      orderBy: {
        nome_empresa: 'asc',
      },
    });

    return {
      empresas, // se não houver nada, retorna []
    };
  }

  async getEmpresasAtivas(
    recrutadorId: number,
    usuarioId: number,
    lang: string,
  ): Promise<{ usuario_id: number; empresas: any[] }> {
    const empresas = await this.prisma.empresa.findMany({
      where: {
        recrutador_id: recrutadorId,
        ativo: true,
        linguagem: lang,
      },
      orderBy: {
        nome_empresa: 'asc',
      },
    });

    return {
      usuario_id: usuarioId,
      empresas, // se não houver nada, retorna []
    };
  }

  async getEmpresasAtivasAll(lang: string): Promise<{ empresas: any[] }> {
    const empresas = await this.prisma.empresa.findMany({
      where: {
        ativo: true,
        linguagem: lang,
      },
      orderBy: {
        nome_empresa: 'asc',
      },
    });

    return {
      empresas, // se não houver nada, retorna []
    };
  }

  async getEmpresa(
    recrutadorId: number,
    /* usuarioId: number,
    perfilId: number, */
    id: number,
  ) {
    const empresa = await this.prisma.empresa.findUnique({
      where: {
        id,
        recrutador_id: recrutadorId,
      },
      include: {
        cidade: {
          select: {
            cidade: true,
            estado_id: true,
            estado: {
              select: {
                estado: true,
              },
            },
          },
        },
      },
    });

    if (!empresa) return null;

    return {
      ...empresa,
      cidade_label: empresa.cidade?.cidade ?? null,
      estado_id: empresa.cidade?.estado_id ?? null,
      estado_label: empresa.cidade?.estado?.estado ?? null,
    };
  }

  async getListaVagasAtivasEmpresa(empresaId: number) {
    const vagas = await this.prisma.empresaVaga.findMany({
      where: {
        empresa_id: empresaId,
      },
      include: {
        modalidade_trabalho: true,
        periodo_trabalho: true,
        empresa: {
          select: {
            id: true,
            nome_empresa: true,
            logo: true,
          },
        },
        cidade: {
          select: {
            estado_id: true,
            cidade: true,
            estado: {
              select: {
                estado: true,
                sigla: true,
              },
            },
          },
        },
      },
    });

    const agora = new Date();

    const vagasAtivas = vagas
      .filter((vaga) => {
        const prazoDate = new Date(vaga.data_cadastro);
        prazoDate.setDate(prazoDate.getDate() + vaga.qtde_dias_aberta);
        return prazoDate >= agora; // só mantém as ativas
      })
      .sort((a, b) => {
        const prazoA = new Date(a.data_cadastro);
        prazoA.setDate(prazoA.getDate() + a.qtde_dias_aberta);

        const prazoB = new Date(b.data_cadastro);
        prazoB.setDate(prazoB.getDate() + b.qtde_dias_aberta);

        // ordem crescente: prazo mais próximo primeiro
        return prazoA.getTime() - prazoB.getTime();
      });

    return vagasAtivas.map((vaga) => {
      const prazoDate = new Date(vaga.data_cadastro);
      prazoDate.setDate(prazoDate.getDate() + vaga.qtde_dias_aberta);

      return {
        empresa_id: vaga.empresa.id,
        logo: vaga.empresa.logo,
        nome_empresa: vaga.empresa.nome_empresa,
        vaga_id: vaga.vaga_id,
        nome_vaga: vaga.nome_vaga,
        local_vaga: vaga.local_vaga,
        data_cadastro: vaga.data_cadastro,
        qtde_dias_aberta: vaga.qtde_dias_aberta,
        qtde_posicao: vaga.qtde_posicao,
        prazo: prazoDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        pcd: vaga.pcd,
        modalidade_trabalho: vaga.modalidade_trabalho,
        periodo_trabalho: vaga.periodo_trabalho,
        ativo: vaga.ativo,
        cidade_label: vaga.cidade?.cidade ?? null,
        estado_id: vaga.cidade?.estado_id ?? null,
        estado_label: vaga.cidade?.estado?.estado ?? null,
        estado_sigla: vaga.cidade?.estado?.sigla ?? null,
      };
    });
  }
}
