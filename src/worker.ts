import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './workers/worker.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);

  console.log('✅ Worker iniciado em modo contínuo');
}

void bootstrap();
