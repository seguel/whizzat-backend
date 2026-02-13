import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { subDays } from 'date-fns';

@Injectable()
export class CandidatoSkillAvaliarWorker implements OnModuleInit {
  private readonly logger = new Logger(CandidatoSkillAvaliarWorker.name);
  private readonly BATCH_SIZE = 500;
  private readonly MAX_REGISTROS = 10000;

  private readonly PLANOS_PRIORIDADE = [
    { planoId: 6, prioridade: 1 },
    { planoId: 5, prioridade: 2 },
    { planoId: 1, prioridade: 3 },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression = this.config.get<string>(
      'CANDIDATO_SKILL_CRON',
      '0 * * * *',
    );

    const job = new CronJob(cronExpression, () => {
      void this.executar();
    });

    this.schedulerRegistry.addCronJob('candidatoSkillWorker', job);
    job.start();

    this.logger.log(`Worker agendado com CRON: ${cronExpression}`);
  }

  async executar(): Promise<void> {
    this.logger.log('Iniciando ciclo do worker');

    let totalCriados = 0;

    for (const plano of this.PLANOS_PRIORIDADE) {
      if (totalCriados >= this.MAX_REGISTROS) break;

      this.logger.log(
        `Processando plano ${plano.planoId} (prioridade ${plano.prioridade})`,
      );

      const usuariosComPlano = await this.prisma.usuarioPerfilPlano.findMany({
        where: {
          ativo: true,
          pagto_pendente: false,
          usuario_perfil: { perfil_id: 1 },
          periodo: {
            perfil_id: 1,
            plano_id: plano.planoId,
            plano: { ativo: true },
          },
        },
        select: { usuario_perfil: { select: { usuario_id: true } } },
      });

      const usuarioIds = usuariosComPlano.map(
        (u) => u.usuario_perfil.usuario_id,
      );
      if (!usuarioIds.length) continue;

      const candidatosSkill = await this.prisma.candidatoSkill.findMany({
        where: {
          ...this.filtroBaseCandidatoSkill(),
          candidato: { usuario_id: { in: usuarioIds } },
        },
        select: {
          id: true,
          candidato: {
            select: {
              linguagem: true,
            },
          },
        },
        take: this.MAX_REGISTROS - totalCriados,
      });

      if (!candidatosSkill.length) continue;

      const payload = candidatosSkill.map((c) => ({
        candidato_skill_id: c.id,
        prioridade_ordem: plano.prioridade,
        data_avaliacao: null,
        avaliacao_pendente: true,
        linguagem: c.candidato.linguagem, // 👈 aqui
      }));

      for (let i = 0; i < payload.length; i += this.BATCH_SIZE) {
        const batch = payload.slice(i, i + this.BATCH_SIZE);
        await this.prisma.$transaction((tx) =>
          tx.candidatoAvaliacaoSkill.createMany({
            data: batch,
            skipDuplicates: true,
          }),
        );
        totalCriados += batch.length;
      }
    }

    this.logger.log(
      `Worker finalizado. Total de avaliações criadas: ${totalCriados}`,
    );
  }

  private filtroBaseCandidatoSkill() {
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);

    return {
      OR: [
        { data_ultima_avaliacao: null },
        { data_ultima_avaliacao: { lt: umAnoAtras } },
      ],
      avaliacoes: { none: {} },
      candidato: {
        data_cadastro: {
          lt: subDays(new Date(), 3),
        },
      },
    };
  }
}
