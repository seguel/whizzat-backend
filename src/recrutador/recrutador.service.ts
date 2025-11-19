import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, empresa, usuario_perfil_recrutador } from '@prisma/client';

@Injectable()
export class RecrutadorService {
  constructor(private readonly prisma: PrismaService) {}

  async getCheckHasPerfil(
    usuarioId: number,
    perfilId: number,
  ): Promise<{ id: number | null; usuario_id: number }> {
    const registro = await this.prisma.usuario_perfil_recrutador.findUnique({
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
    nomeUser: string,
  ): Promise<{ id: number | null; usuario_id: number; nome_user: string }> {
    const registro = await this.prisma.usuario_perfil_recrutador.findUnique({
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
      nome_user: nomeUser,
    };
  }

  async hasPerfilInEmpresa(recrutadorId: number): Promise<boolean> {
    const vinculo: empresa | null = await this.prisma.empresa.findFirst({
      where: {
        recrutador_id: recrutadorId,
      },
    });

    return !!vinculo;
  }

  async createRecrutador(data: {
    usuario_id: number;
    perfil_id: number;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    meio_notificacao: string;
    logo: string;
    language: string;
  }) {
    const createData: Prisma.usuario_perfil_recrutadorCreateInput = {
      usuario: {
        connect: { id: data.usuario_id },
      },
      perfil: {
        connect: { id: data.perfil_id },
      },
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      meio_notificacao: data.meio_notificacao,
      logo: data.logo ?? '',
      linguagem: data.language,
    };

    // --- Criação ---
    return this.prisma.usuario_perfil_recrutador.create({
      data: createData,
    });
  }

  async updateRecrutador(data: {
    id: number;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    meio_notificacao: string;
    logo?: string;
    ativo: boolean;
  }) {
    const updateData: Prisma.usuario_perfil_recrutadorUpdateInput = {
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      meio_notificacao: data.meio_notificacao,
      ativo: data.ativo,
    };

    // adiciona só se existir
    if (data.logo) updateData.logo = data.logo;

    return this.prisma.usuario_perfil_recrutador.update({
      where: {
        id: data.id,
      },
      data: updateData,
    });
  }

  async getRecrutador(
    id: number,
    usuarioId: number,
    perfilId: number,
    nomeUser: string,
  ): Promise<{
    nomeUser: string;
    recrutador: usuario_perfil_recrutador | null;
  }> {
    const recrutador = await this.prisma.usuario_perfil_recrutador.findFirst({
      where: {
        id: id,
        usuario_id: usuarioId,
        perfil_id: perfilId,
      },
    });

    return {
      nomeUser,
      recrutador,
    };
  }
}
