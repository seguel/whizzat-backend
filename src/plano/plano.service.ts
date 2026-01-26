import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type ValidaPlanoRetorno =
  | { status: 'OK'; plano: string; vencimento: Date }
  | { status: 'SEM_PERFIL' }
  | { status: 'SEM_PLANO' }
  | { status: 'PLANO_EXPIRADO'; plano: string; vencimento: Date };

@Injectable()
export class PlanoService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlanos(language: string, perfilId?: number) {
    const planos = await this.prisma.plano.findMany({
      where: {
        ativo: true,
        linguagem: {
          some: {
            linguagem: language,
          },
        },
        periodos: {
          some: {
            ativo: true,
            ...(perfilId ? { perfil_id: perfilId } : {}),
          },
        },
      },
      select: {
        id: true,
        highlight: true,
        linguagem: {
          where: {
            linguagem: language,
          },
          select: {
            plano: true,
            descricao: true,
          },
        },
        periodos: {
          where: {
            ativo: true,
            ...(perfilId ? { perfil_id: perfilId } : {}),
          },
          orderBy: {
            perfil_id: 'asc', // 🔥 ordena aqui
          },
          select: {
            id: true,
            periodo: true,
            validade_dias: true,
            valor: true,
            perfil_id: true,
            valor_old: true,
            desconto: true,
          },
        },
        itens: {
          where: {
            linguagem: language,
          },
          orderBy: {
            ordem: 'asc', // 🔥 ordena aqui
          },
          select: {
            id: true,
            descricao: true,
          },
        },
      },
    });

    return planos;
  }

  async getPlano(id: number) {
    return await this.prisma.plano.findUnique({
      where: { id },
    });
  }

  async postPlano(
    userId: number,
    perfilId: number,
    planoPeriodoId: number,
    language: string,
    token_pagto?: string,
  ): Promise<ValidaPlanoRetorno> {
    const pagamentoConfirmado = Boolean(token_pagto);

    // 1) Criar ou obter usuario_perfil
    const usuarioPerfil = await this.prisma.usuarioPerfil.upsert({
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
    const planoUsuario = await this.prisma.usuarioPerfilPlano.upsert({
      where: {
        usuario_perfil_id: usuarioPerfil.id,
      },
      create: {
        usuario_perfil_id: usuarioPerfil.id,
        plano_periodo_id: planoPeriodoId,
        ativo: pagamentoConfirmado,
        pagto_pendente: !pagamentoConfirmado,
      },
      update: {
        plano_periodo_id: planoPeriodoId,
        data_inicio: new Date(),
        ativo: pagamentoConfirmado,
        pagto_pendente: !pagamentoConfirmado,
      },
    });

    // 4) Buscar dados do período (validade dias)
    const planoPeriodo = await this.prisma.planoPeriodo.findUnique({
      where: { id: planoPeriodoId },
      include: {
        plano: {
          include: {
            linguagem: {
              where: { linguagem: language }, // 🔹 filtra a linguagem desejada
              select: {
                plano: true,
                descricao: true,
              },
            },
          },
        },
      },
    });

    if (token_pagto) {
      await this.prisma.planoPagtoLog.create({
        data: {
          usuario_perfil_plano_id: planoUsuario.id,
          transacao_id: token_pagto,
          data_pagto: new Date(),
          valor: planoPeriodo?.valor ?? 0,
          status: 'OK',
        },
      });
    }

    const nome = planoPeriodo?.plano.linguagem[0]?.plano;
    const validadeDias = planoPeriodo?.validade_dias ?? 30;
    const dataInicio = planoUsuario.data_inicio ?? new Date();

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
    const usuarioPerfil = await this.prisma.usuarioPerfil.findUnique({
      where: {
        usuario_id_perfil_id: { usuario_id: usuarioId, perfil_id: perfilId },
      },
    });

    if (!usuarioPerfil) {
      return { status: 'SEM_PLANO' };
    }

    // 2) Buscar plano ativo desse usuario_perfil
    const planoUsuario = await this.prisma.usuarioPerfilPlano.findFirst({
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
