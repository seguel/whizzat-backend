import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CandidatoAvaliacaoSkill,
  CandidatoSkill,
  AvaliadorRankingAvaliacao,
} from '@prisma/client';

type AvaliacaoComRelacoes = CandidatoAvaliacaoSkill & {
  candidatoSkill: CandidatoSkill;
  avaliadorRanking: AvaliadorRankingAvaliacao[];
};

const MAX_AVALIADORES_POR_SKILL = 3;
const HORAS_EXPIRACAO_CONVITE = 48;
// const BATCH_SIZE = 10;

@Injectable()
export class AvaliadorDispatcherWorker {
  private readonly logger = new Logger(AvaliadorDispatcherWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  async executar(): Promise<void> {
    this.logger.log('Iniciando worker de dispatch de avaliadores');

    await this.expirarConvites();
    await this.criarConvitesComLock();

    this.logger.log('Finalizando worker de dispatch de avaliadores');
  }

  /**
   * 1️⃣ Expira convites vencidos
   */
  private async expirarConvites(): Promise<void> {
    const agora = new Date();

    const result = await this.prisma.avaliadorRankingAvaliacao.updateMany({
      where: {
        aceite: null,
        data_expiracao: {
          lt: agora,
        },
      },
      data: {
        aceite: false,
        data_aceite_recusa: agora,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Convites expirados: ${result.count}`);
    }
  }

  /**
   * 2️⃣ Cria convites usando lock concorrente
   */
  private async criarConvitesComLock(): Promise<void> {
    const BATCH_SIZE = 10;
    const MAX_AVALIADORES_POR_SKILL = 3;
    const agora = new Date();
    const expira = new Date(agora.getTime() + 48 * 60 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      // 1️⃣ Buscar avaliações pendentes priorizando quem paga mais
      const avaliacoes = await tx.candidatoAvaliacaoSkill.findMany({
        where: {
          avaliador_id: null,
          avaliacao_pendente: true,
        },
        take: BATCH_SIZE,
        orderBy: [{ prioridade_ordem: 'asc' }, { id: 'asc' }],
        include: {
          candidatoSkill: true,
        },
      });

      for (const avaliacao of avaliacoes) {
        const skillId = avaliacao.candidatoSkill.skill_id;

        // 2️⃣ Buscar avaliadores elegíveis
        const avaliadoresComSkill = await tx.avaliadorSkill.findMany({
          where: {
            skill_id: skillId,
            avaliador: {
              ativo: true,
              avaliar_todos: true,
              liberado_avaliar: true,
              linguagem: avaliacao.linguagem,
            },
          },
          include: {
            avaliador: {
              select: {
                id: true,
                usuario_id: true,
                pontos: true,
                _count: {
                  select: {
                    avaliadorRanking: {
                      where: {
                        data_aceite_recusa: null,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // 3️⃣ Filtrar quem tem menos de 3 avaliações abertas
        const avaliadoresDisponiveis = avaliadoresComSkill
          .filter((a) => a.avaliador._count.avaliadorRanking < 3)
          // 4️⃣ Ordenar por:
          //    1º menor carga
          //    2º maior pontuação
          .sort((a, b) => {
            const cargaA = a.avaliador._count.avaliadorRanking;
            const cargaB = b.avaliador._count.avaliadorRanking;

            if (cargaA !== cargaB) {
              return cargaA - cargaB; // menor carga primeiro
            }

            return b.avaliador.pontos - a.avaliador.pontos; // maior pontuação primeiro
          })
          .slice(0, MAX_AVALIADORES_POR_SKILL);

        if (avaliadoresDisponiveis.length === 0) {
          this.logger.log(
            `Nenhum avaliador disponível | avaliacaoSkill=${avaliacao.id}`,
          );
          continue;
        }

        // 5️⃣ Criar convites
        for (const avaliador of avaliadoresDisponiveis) {
          try {
            await tx.avaliadorRankingAvaliacao.create({
              data: {
                avaliador_id: avaliador.avaliador_id,
                avaliacao_skill_id: avaliacao.id,
                data_convite: agora,
                data_expiracao: expira,
              },
            });

            await tx.notificacao.create({
              data: {
                usuario_id: avaliador.avaliador.usuario_id,
                perfil_tipo: 'AVALIADOR',
                perfil_id: avaliador.avaliador.id,
                tipo: 'NOVA_SKILL',
                referencia_id: avaliacao.id,
                titulo: 'Nova skill disponível para avaliação',
                mensagem: `Você recebeu uma nova skill para avaliar.`,
              },
            });

            this.logger.log(
              `Convite + Notificação criada | Avaliador=${avaliador.avaliador_id} AvaliacaoSkill=${avaliacao.id}`,
            );
          } catch (error) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2002'
            ) {
              this.logger.warn(
                `Convite ignorado (duplicado) | Avaliador=${avaliador.avaliador_id} AvaliacaoSkill=${avaliacao.id}`,
              );
              continue;
            }

            throw error;
          }
        }
      }
    });
  }

  /**
   * Processa uma avaliação específica (já lockada)
   */
  private async processarAvaliacaoComTx(
    tx: Prisma.TransactionClient,
    avaliacao: AvaliacaoComRelacoes,
  ): Promise<void> {
    const convitesAtivos = avaliacao.avaliadorRanking.filter(
      (c) => c.aceite === null,
    );

    if (convitesAtivos.length >= MAX_AVALIADORES_POR_SKILL) {
      return;
    }

    const avaliadoresIgnorados = avaliacao.avaliadorRanking.map(
      (c) => c.avaliador_id,
    );

    const avaliadores = await tx.avaliadorSkill.findMany({
      where: {
        skill_id: avaliacao.candidatoSkill.skill_id,
        avaliador_id: {
          notIn: avaliadoresIgnorados,
        },
        avaliador: {
          ativo: true,
          avaliar_todos: true,
          liberado_avaliar: true,
        },
      },
      take: MAX_AVALIADORES_POR_SKILL - convitesAtivos.length,
    });

    if (avaliadores.length === 0) {
      this.logger.log(
        `Nenhum avaliador encontrado | avaliacaoSkill=${avaliacao.id}`,
      );
      return;
    }

    for (const avaliador of avaliadores) {
      await this.criarConviteComTx(tx, avaliacao.id, avaliador.avaliador_id);
    }
  }

  /**
   * Cria convite dentro da transação
   */
  private async criarConviteComTx(
    tx: Prisma.TransactionClient,
    avaliacaoSkillId: number,
    avaliadorId: number,
  ): Promise<void> {
    const agora = new Date();
    const expira = new Date(
      agora.getTime() + HORAS_EXPIRACAO_CONVITE * 60 * 60 * 1000,
    );

    try {
      await tx.avaliadorRankingAvaliacao.create({
        data: {
          avaliador_id: avaliadorId,
          avaliacao_skill_id: avaliacaoSkillId,
          data_convite: agora,
          data_expiracao: expira,
        },
      });

      this.logger.log(
        `Convite criado | avaliador=${avaliadorId} avaliacaoSkill=${avaliacaoSkillId}`,
      );
    } catch {
      // Pode acontecer por concorrência (@@unique)
      this.logger.warn(
        `Convite ignorado (duplicado) | avaliador=${avaliadorId} avaliacaoSkill=${avaliacaoSkillId}`,
      );
    }
  }
}
