import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Cron } from '@nestjs/schedule';
import { Prisma, TipoNotificacao } from '@prisma/client';

type NotificacaoComUsuario = Prisma.NotificacaoGetPayload<{
  include: { usuario: true };
}>;

interface GrupoNotificacao {
  usuario: NotificacaoComUsuario['usuario'];
  perfil_id: number;
  notificacoes: NotificacaoComUsuario[];
}

@Injectable()
export class EmailResumoSkillWorker {
  private readonly logger = new Logger(EmailResumoSkillWorker.name);
  private readonly LOCK_ID = 1003;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

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

    this.logger.log('Iniciando EmailResumoSkillWorker');

    try {
      const notificacoes: NotificacaoComUsuario[] =
        await this.prisma.notificacao.findMany({
          where: {
            enviada_email: false,
            tipo: TipoNotificacao.NOVA_SKILL,
          },
          include: {
            usuario: true,
          },
          orderBy: {
            criado_em: 'asc',
          },
        });

      if (!notificacoes.length) {
        this.logger.log('Nenhuma notificação pendente.');
        return;
      }

      const agrupado = notificacoes.reduce(
        (acc, notif) => {
          const key = `${notif.usuario_id}_${notif.perfil_id}`;

          if (!acc[key]) {
            acc[key] = {
              usuario: notif.usuario,
              perfil_id: notif.perfil_id,
              notificacoes: [],
            };
          }

          acc[key].notificacoes.push(notif);

          return acc;
        },
        {} as Record<string, GrupoNotificacao>,
      );

      for (const key of Object.keys(agrupado)) {
        const grupo = agrupado[key];

        try {
          const dashboardLink = this.montarLinkDashboard(grupo.perfil_id);

          const quantidade = grupo.notificacoes.length;

          const nomeCompleto = grupo.usuario.nome_social?.trim()
            ? `${grupo.usuario.nome_social}`
            : `${grupo.usuario.primeiro_nome} ${grupo.usuario.ultimo_nome}`;

          await this.mailService.enviarResumoNotificacoes(
            grupo.usuario.email,
            nomeCompleto,
            grupo.usuario.linguagem ?? 'pt',
            quantidade,
            dashboardLink,
          );

          await this.prisma.notificacao.updateMany({
            where: {
              id: {
                in: grupo.notificacoes.map((n) => n.id),
              },
            },
            data: {
              enviada_email: true,
            },
          });

          this.logger.log(
            `Email enviado usuario=${grupo.usuario.id} (${quantidade} notificações)`,
          );
        } catch (error) {
          this.logger.error(
            `Erro ao enviar email usuario=${grupo.usuario.id}`,
            error,
          );
        }
      }

      this.logger.log('Finalizando EmailResumoSkillWorker');
    } catch (error) {
      this.logger.error('Erro geral no EmailResumoSkillWorker', error);
    } finally {
      // 👇 GARANTE LIBERAÇÃO DO LOCK
      await this.releaseLock();
    }
  }

  private montarLinkDashboard(perfilId: number): string {
    const baseUrl = process.env.FRONTEND_URL;

    if (!baseUrl) {
      this.logger.warn('FRONTEND_URL não definida');
      return '';
    }

    switch (perfilId) {
      case 1:
      case 2:
      case 3:
      default:
        return `${baseUrl}/cadastro/login`;
    }
  }
}
