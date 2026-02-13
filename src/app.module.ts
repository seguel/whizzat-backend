import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './empresa/empresa.module';
import { ModalidadeModule } from './modalidade/modalidade.module';
import { PeriodoModule } from './periodo/periodo.module';
import { UploadModule } from './upload/upload.module';
import { SkillModule } from './skill/skill.module';
import { AvaliadorModule } from './avaliador/avaliador.module';
import { RecrutadorModule } from './recrutador/recrutador.module';
// import { MailService } from './mail/mail.service';
import { ConfigModule } from '@nestjs/config';
// import {
//   I18nModule,
//   I18nJsonLoader,
//   AcceptLanguageResolver,
//   QueryResolver,
//   CookieResolver,
// } from 'nestjs-i18n';
import { VagaModule } from './vaga/vaga.module';
import { GraduacaoModule } from './graduacao/graduacao.module';
import { CertificacoesModule } from './certificacoes/certificacoes.module';
import { CandidatoModule } from './candidato/candidato.module';
import { GeneroModule } from './genero/genero.module';
import { EstadoModule } from './estado/estado.module';
import { CidadeModule } from './cidade/cidade.module';
import { PlanoModule } from './plano/plano.module';
import { ScheduleModule } from '@nestjs/schedule';
// import * as path from 'path';

import { CandidatoSkillAvaliarWorker } from './workers/candidato-skill-avaliar.worker';
import { I18nGlobalModule } from './i18n/i18n.module';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;

@Module({
  imports: [
    I18nGlobalModule,
    ConfigModule.forRoot({
      envFilePath: envFile,
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
    AuthModule,
    EmpresaModule,
    ModalidadeModule,
    PeriodoModule,
    SkillModule,
    UploadModule,
    AvaliadorModule,
    RecrutadorModule,
    VagaModule,
    GraduacaoModule,
    CertificacoesModule,
    CandidatoModule,
    GeneroModule,
    EstadoModule,
    CidadeModule,
    PlanoModule,
  ],
  providers: [CandidatoSkillAvaliarWorker],
})
export class AppModule {}
