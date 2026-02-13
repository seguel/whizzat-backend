import { Module } from '@nestjs/common';
import { CandidatoSkillAvaliarWorker } from './candidato-skill-avaliar.worker';
import { AvaliadorDispatcherWorker } from './avaliador-dispatcher.worker';
import { EmailResumoSkillWorker } from './email-dispatcher.worker';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerRegistry, ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';
import {
  I18nModule,
  I18nJsonLoader,
  AcceptLanguageResolver,
  QueryResolver,
  CookieResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    I18nModule.forRoot({
      fallbackLanguage: 'pt',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n'),
        watch: false, // worker não precisa watch
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale'] },
        CookieResolver,
        AcceptLanguageResolver,
      ],
    }),

    MailModule,
  ],
  providers: [
    CandidatoSkillAvaliarWorker,
    AvaliadorDispatcherWorker,
    EmailResumoSkillWorker,
    PrismaService,
    SchedulerRegistry,
  ],
})
export class WorkerModule {}
