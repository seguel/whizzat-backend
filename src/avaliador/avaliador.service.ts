import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AvaliadorService {
  constructor(private readonly prisma: PrismaService) {}

  async getCheckHasPerfil(
    usuarioId: number,
    perfilId: number,
  ): Promise<{ id: number | null; usuario_id: number }> {
    const registro = await this.prisma.usuario_perfil_avaliador.findUnique({
      where: {
        ativo: true,
        usuario_id_perfil_id: {
          // <-- chave composta
          usuario_id: usuarioId,
          perfil_id: perfilId,
        },
      },
      select: { id: true }, // só pode usar colunas existentes
    });

    return {
      id: registro?.id ?? null,
      usuario_id: usuarioId, // adiciona manualmente
    };
  }

  async getCheckHasPerfilCadastro(
    usuarioId: number,
    perfilId: number,
  ): Promise<{ id: number | null; usuario_id: number }> {
    const registro = await this.prisma.usuario_perfil_avaliador.findUnique({
      where: {
        usuario_id_perfil_id: {
          // <-- chave composta
          usuario_id: usuarioId,
          perfil_id: perfilId,
        },
      },
      select: { id: true }, // só pode usar colunas existentes
    });

    return {
      id: registro?.id ?? null,
      usuario_id: usuarioId, // adiciona manualmente
    };
  }

  async getAvaliador(id: number, usuarioId: number, perfilId: number) {
    return this.prisma.usuario_perfil_avaliador.findUnique({
      where: {
        id: id,
        usuario_id: usuarioId,
        perfil_id: perfilId,
      },
      include: {
        skills: {
          include: {
            skill: true, // traz também os dados da tabela `skill`
          },
        },
      },
    });
  }

  async createAvaliador(data: {
    usuario_id: number;
    perfil_id: number;
    empresa_id: number | null;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    avaliar_todos: boolean;
    logo?: string;
    meio_notificacao: string;
  }) {
    const createData: Prisma.usuario_perfil_avaliadorCreateInput = {
      usuario: {
        connect: { id: data.usuario_id },
      },
      perfil: {
        connect: { id: data.perfil_id },
      },
      empresa: data.empresa_id
        ? { connect: { id: data.empresa_id } }
        : undefined,
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      avaliar_todos: data.avaliar_todos,
      logo: data.logo ?? '',
      meio_notificacao: data.meio_notificacao,
    };

    return this.prisma.usuario_perfil_avaliador.create({
      data: createData,
    });
  }

  async updateAvaliador(data: {
    avaliador_id: number;
    usuario_id: number;
    perfil_id: number;
    empresa_id: number | null;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    avaliar_todos: boolean;
    logo?: string;
    meio_notificacao: string;
    ativo: boolean;
  }) {
    return this.prisma.usuario_perfil_avaliador.update({
      where: {
        id: data.avaliador_id,
        usuario_id: data.usuario_id,
        perfil_id: data.perfil_id,
      },
      data: {
        empresa_id: data.empresa_id,
        telefone: data.telefone,
        localizacao: data.localizacao,
        apresentacao: data.apresentacao,
        avaliar_todos: data.avaliar_todos,
        logo: data.logo ?? '',
        meio_notificacao: data.meio_notificacao,
        ativo: data.ativo,
      },
    });
  }

  async getEmpresasCadastro(): Promise<{
    empresas: { id: number; nome_empresa: string }[];
  }> {
    const empresas = await this.prisma.empresa.findMany({
      select: {
        id: true,
        nome_empresa: true,
      },
      orderBy: {
        nome_empresa: 'asc',
      },
    });

    return { empresas };
  }

  async createAvaliadorSkills(skills: Prisma.avaliador_skillCreateManyInput[]) {
    return this.prisma.avaliador_skill.createMany({
      data: skills,
    });
  }

  async updateAvaliadorSkills(
    avaliador_id: number,
    skills: {
      avaliador_id: number;
      skill_id: number;
      peso: number;
      favorito: boolean;
      tempo_favorito: string;
    }[],
  ) {
    // Remove todas as skills antigas
    await this.prisma.avaliador_skill.deleteMany({
      where: { avaliador_id },
    });

    // Insere as novas
    if (skills.length > 0) {
      await this.prisma.avaliador_skill.createMany({
        data: skills,
      });
    }
  }
}
