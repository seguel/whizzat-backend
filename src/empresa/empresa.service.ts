import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, usuario_perfil_empresa } from '@prisma/client';

@Injectable()
export class EmpresaService {
  constructor(private readonly prisma: PrismaService) {}

  async createEmpresa(data: {
    usuario_id: number;
    perfil_id: number;
    nome_empresa: string;
    website: string;
    email: string;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    logo: string;
    imagem_fundo: string;
  }) {
    return this.prisma.usuario_perfil_empresa.create({
      data,
    });
  }

  async getEmpresas(
    usuarioId: number,
    perfilId: number,
  ): Promise<{ usuario_id: number; perfil_id: number; empresas: any[] }> {
    const empresas = await this.prisma.usuario_perfil_empresa.findMany({
      where: { usuario_id: usuarioId, perfil_id: perfilId },
      orderBy: {
        nome_empresa: 'asc',
      },
    });

    return {
      usuario_id: usuarioId,
      perfil_id: perfilId,
      empresas, // se não houver nada, retorna []
    };
  }

  async getEmpresa(id: number): Promise<usuario_perfil_empresa | null> {
    return this.prisma.usuario_perfil_empresa.findUnique({
      where: { empresa_id: id },
    });
  }

  async hasPerfilInEmpresa(
    usuarioId: number,
    perfil: number,
  ): Promise<boolean> {
    const vinculo: usuario_perfil_empresa | null =
      await this.prisma.usuario_perfil_empresa.findFirst({
        where: {
          usuario_id: usuarioId,
          perfil_id: perfil,
        },
      });

    return !!vinculo;
  }

  async createVaga(data: {
    empresa_id: number;
    nome_vaga: string;
    descricao: string;
    local_vaga: string;
    modalidade_trabalho_id: number;
    periodo_trabalho_id: number;
    pcd: boolean;
    qtde_dias_aberta: number;
    qtde_posicao: number;
    data_cadastro: Date;
  }) {
    return this.prisma.empresa_vaga.create({
      data,
    });
  }

  async createVagaSkills(skills: Prisma.empresa_vaga_skillCreateManyInput[]) {
    return this.prisma.empresa_vaga_skill.createMany({
      data: skills,
    });
  }

  async getVagas(
    empresaId: number,
  ): Promise<{ empresa_id: number; vagas: any[] }> {
    const vagas = await this.prisma.empresa_vaga.findMany({
      where: { empresa_id: empresaId },
    });

    return {
      empresa_id: empresaId,
      vagas, // se não houver nada, retorna []
    };
  }

  async getVaga(id: number) {
    return this.prisma.empresa_vaga.findUnique({
      where: { vaga_id: id },
      include: {
        modalidade_trabalho: true,
        periodo_trabalho: true,
        skills: {
          select: {
            skill_id: true,
            peso: true,
            avaliador_proprio: true,
            skill: {
              select: {
                skill: true, // nome da skill
              },
            },
          },
        },
        empresa: {
          select: {
            nome_empresa: true,
            logo: true,
          },
        },
      },
    });
  }

  async getVagasSugeridas(userId: number, perfilId: number) {
    const empresas = await this.prisma.usuario_perfil_empresa.findMany({
      where: { usuario_id: userId, perfil_id: perfilId },
      select: {
        empresa_id: true,
        logo: true,
        nome_empresa: true,
        vagas: {
          select: {
            vaga_id: true,
            nome_vaga: true,
            local_vaga: true,
            pcd: true,
            qtde_dias_aberta: true,
            data_cadastro: true,
          },
        },
      },
    });

    // transforma em array plano de vagas, adicionando prazo e infos da empresa
    const vagasPlanas = empresas.flatMap((empresa) =>
      empresa.vagas.map((vaga) => {
        const prazoDate = new Date(vaga.data_cadastro);
        prazoDate.setDate(prazoDate.getDate() + vaga.qtde_dias_aberta);

        return {
          empresa_id: empresa.empresa_id,
          logo: empresa.logo,
          nome_empresa: empresa.nome_empresa,
          vaga_id: vaga.vaga_id,
          nome_vaga: vaga.nome_vaga,
          localizacao: vaga.local_vaga,
          data_cadastro: vaga.data_cadastro,
          qtde_dias_aberta: vaga.qtde_dias_aberta,
          prazo: prazoDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          pcd: vaga.pcd,
        };
      }),
    );

    return vagasPlanas;
  }
}
