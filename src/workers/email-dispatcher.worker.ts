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

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Cron(process.env.EMAIL_RESUMO_SKILL_CRON || '*/10 * * * *')
  async executar(): Promise<void> {
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

          const nomeCompleto = `${grupo.usuario.primeiro_nome} ${grupo.usuario.ultimo_nome}`;

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
