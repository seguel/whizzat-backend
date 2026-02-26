import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const MAX_AVALIADORES_POR_SKILL = 3;
const HORAS_EXPIRACAO_CONVITE = 72;

@Injectable()
export class AvaliadorDispatcherWorker {
  private readonly logger = new Logger(AvaliadorDispatcherWorker.name);

  private readonly LOCK_ID = 1002; // 👈 ID único desse worker

  constructor(private readonly prisma: PrismaService) {}

  // 🔐 MÉTODOS DE LOCK
  private async acquireLock(): Promise<boolean> {
    const result = await this.prisma.$queryRawUnsafe<
      { pg_try_advisory_lock: boolean }[]
    >(`SELECT pg_try_advisory_lock(${this.LOCK_ID})`);

    return result[0]?.pg_try_advisory_lock ?? false;
  }

  private async releaseLock(): Promise<void> {
    await this.prisma.$queryRawUnsafe(
      `SELECT pg_advisory_unlock(${this.LOCK_ID})`,
    );
  }

  @Cron(process.env.CANDIDATO_SKILL_CRON || '*/5 * * * *')
  async executar(): Promise<void> {
    // 👇 TENTA PEGAR O LOCK
    const locked = await this.acquireLock();

    if (!locked) {
      this.logger.warn('Worker já está rodando em outra instância.');
      return;
    }
    this.logger.log('Iniciando worker de dispatch de avaliadores');

    try {
      await this.expirarConvites();
      await this.criarConvitesComLock();

      this.logger.log('Finalizando worker de dispatch de avaliadores');
    } catch (error) {
      this.logger.error('Erro no AvaliadorDispatcherWorker', error);
    } finally {
      // 👇 GARANTE LIBERAÇÃO DO LOCK
      await this.releaseLock();
    }
  }

  /**
   * 1️⃣ Expira convites vencidos
   */
  private async expirarConvites(): Promise<void> {
    const agora = new Date();

    await this.prisma.$transaction(async (tx) => {
      // 1️⃣ Buscar convites expirados
      const convitesExpirados = await tx.avaliadorRankingAvaliacao.findMany({
        where: {
          aceite: null,
          data_expiracao: {
            lt: agora,
          },
        },
        select: {
          id: true,
        },
      });

      if (convitesExpirados.length === 0) {
        return;
      }

      const ids = convitesExpirados.map((c) => c.id);

      // 2️⃣ Excluir notificações relacionadas
      await tx.notificacao.deleteMany({
        where: {
          referencia_id: {
            in: ids,
          },
          tipo: 'NOVA_SKILL',
        },
      });

      // 3️⃣ Excluir convites
      const result = await tx.avaliadorRankingAvaliacao.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      this.logger.log(`Convites expirados removidos: ${result.count}`);
    });
  }

  /**
   * 2️⃣ Cria convites usando lock concorrente
   */
  private async criarConvitesComLock(): Promise<void> {
    const BATCH_SIZE = 10;
    const agora = new Date();
    const expira = new Date(
      agora.getTime() + HORAS_EXPIRACAO_CONVITE * 60 * 60 * 1000,
    );

    const tx = this.prisma; // 👈 removido $transaction

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

      const avaliadoresComSkill = await tx.avaliadorSkill.findMany({
        where: {
          skill_id: skillId,
          favorito: true, //favorito indica qual skill ele quer ser um avaliador
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

      const avaliadoresDisponiveis = avaliadoresComSkill
        .filter((a) => a.avaliador._count.avaliadorRanking <= 5)
        .sort((a, b) => {
          const cargaA = a.avaliador._count.avaliadorRanking;
          const cargaB = b.avaliador._count.avaliadorRanking;

          if (cargaA !== cargaB) {
            return cargaA - cargaB;
          }

          return b.avaliador.pontos - a.avaliador.pontos;
        })
        .slice(0, MAX_AVALIADORES_POR_SKILL);

      if (avaliadoresDisponiveis.length === 0) {
        this.logger.log(
          `Nenhum avaliador disponível | avaliacaoSkill=${avaliacao.id}`,
        );
        continue;
      }

      for (const avaliador of avaliadoresDisponiveis) {
        try {
          const avaliadorRank = await tx.avaliadorRankingAvaliacao.create({
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
              perfil_id: 3,
              tipo: 'NOVA_SKILL',
              referencia_id: avaliadorRank.id,
              titulo: 'Nova skill disponível para avaliação',
              mensagem: 'Você recebeu uma nova skill para avaliar.',
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
  }
}
