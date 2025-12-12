import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { plano } from '@prisma/client';

export type ValidaPlanoRetorno =
  | { status: 'OK'; plano: string; vencimento: Date }
  | { status: 'SEM_PERFIL' }
  | { status: 'SEM_PLANO' }
  | { status: 'PLANO_EXPIRADO'; plano: string; vencimento: Date };

@Injectable()
export class PlanoService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlanos(language: string): Promise<plano[]> {
    return this.prisma.plano.findMany({
      where: { ativo: true, linguagem: language },
      orderBy: {
        plano: 'asc', // ou 'desc'
      },
    });
  }

  async getPlano(id: number): Promise<plano | null> {
    return this.prisma.plano.findUnique({
      where: { id },
    });
  }

  async postPlano(
    userId: number,
    perfilId: number,
    planoPeriodoId: number,
  ): Promise<ValidaPlanoRetorno> {
    // 1) Criar ou obter usuario_perfil
    const usuarioPerfil = await this.prisma.usuario_perfil.upsert({
      where: {
        usuario_id_perfil_id: {
          usuario_id: userId,
          perfil_id: perfilId,
        },
      },
      create: {
        usuario_id: userId,
        perfil_id: perfilId,
      },
      update: {}, // nada para atualizar, já que é só o vínculo
    });

    // 2) Criar OU atualizar um plano já existente para esse usuario_perfil
    const planoUsuario = await this.prisma.usuario_perfil_plano.upsert({
      where: {
        usuario_perfil_id: usuarioPerfil.id, // precisa ser UNIQUE
      },
      create: {
        usuario_perfil_id: usuarioPerfil.id,
        plano_periodo_id: planoPeriodoId,
        ativo: true,
      },
      update: {
        plano_periodo_id: planoPeriodoId,
        data_inicio: new Date(),
        ativo: true,
      },
    });

    // 3) Buscar dados do período (validade dias)
    const planoPeriodo = await this.prisma.plano_periodo.findFirst({
      where: {
        id: planoPeriodoId,
        ativo: true,
      },
      include: {
        plano: true,
      },
    });

    const nome = planoPeriodo?.plano.plano;
    const validadeDias = planoPeriodo?.validade_dias ?? 30;
    const dataInicio = planoUsuario.data_inicio;

    const dataVencimento = new Date(
      dataInicio.getTime() + validadeDias * 24 * 60 * 60 * 1000,
    );

    return {
      status: 'OK',
      plano: nome ?? '',
      vencimento: dataVencimento,
    };
  }

  async validaPlanoUsuario(
    usuarioId: number,
    perfilId: number,
  ): Promise<ValidaPlanoRetorno> {
    // 1) Buscar o registro usuario_perfil
    const usuarioPerfil = await this.prisma.usuario_perfil.findUnique({
      where: {
        usuario_id_perfil_id: { usuario_id: usuarioId, perfil_id: perfilId },
      },
    });

    if (!usuarioPerfil) {
      return { status: 'SEM_PLANO' };
    }

    // 2) Buscar plano ativo desse usuario_perfil
    const planoUsuario = await this.prisma.usuario_perfil_plano.findFirst({
      where: {
        usuario_perfil_id: usuarioPerfil.id,
        ativo: true,
      },
      include: {
        periodo: {
          select: {
            validade_dias: true,
            plano: true,
          },
        },
      },
    });

    if (!planoUsuario) {
      return { status: 'SEM_PLANO' };
    }

    // 3) Validar a data
    const nome = planoUsuario.periodo.plano.plano;
    const dataInicio = planoUsuario.data_inicio; // Agora é Date, do Prisma
    const validadeDias = planoUsuario.periodo.validade_dias;

    const dataVencimento = new Date(
      dataInicio.getTime() + validadeDias * 24 * 60 * 60 * 1000,
    );

    const hoje = new Date();

    if (dataVencimento < hoje) {
      return {
        status: 'PLANO_EXPIRADO',
        plano: nome,
        vencimento: dataVencimento,
      };
    }

    return { status: 'OK', plano: nome, vencimento: dataVencimento };
  }
}
