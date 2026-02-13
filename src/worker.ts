import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './workers/worker.module';
import { CandidatoSkillAvaliarWorker } from './workers/candidato-skill-avaliar.worker';
import { AvaliadorDispatcherWorker } from './workers/avaliador-dispatcher.worker';
import { EmailResumoSkillWorker } from './workers/email-dispatcher.worker';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);

  const workerName = process.env.WORKER_NAME;

  switch (workerName) {
    case 'CANDIDATO_SKILL':
      await app.get(CandidatoSkillAvaliarWorker).executar();
      break;

    case 'AVALIADOR_DISPATCHER':
      await app.get(AvaliadorDispatcherWorker).executar();
      break;

    case 'MAIL_RESUMO':
      await app.get(EmailResumoSkillWorker).executar();
      break;

    default:
      throw new Error(`WORKER_NAME inválido: ${workerName}`);
  }

  await app.close();
}

void bootstrap();
