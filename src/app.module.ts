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
import { MailService } from './mail/mail.service';
import { ConfigModule } from '@nestjs/config';
import {
  I18nModule,
  I18nJsonLoader,
  AcceptLanguageResolver,
  QueryResolver,
  CookieResolver,
} from 'nestjs-i18n';
import { VagaModule } from './vaga/vaga.module';
import * as path from 'path';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'pt',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n'),
        watch: true,
        interpolation: {
          prefix: '{{',
          suffix: '}}',
        },
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale'] },
        CookieResolver,
        AcceptLanguageResolver,
      ],
    }),
    ConfigModule.forRoot({
      envFilePath: envFile,
      isGlobal: true,
    }),
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
  ],
  providers: [MailService],
})
export class AppModule {}
