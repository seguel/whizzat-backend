import { Module } from '@nestjs/common';
import { CandidatoService } from './candidato.service';
import { CandidatoController } from './candidato.controller';
import { SkillModule } from '../skill/skill.module';
import { CertificacoesModule } from '../certificacoes/certificacoes.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key',
      signOptions: { expiresIn: '1d' },
    }),
    SkillModule,
    CertificacoesModule,
  ],
  controllers: [CandidatoController],
  providers: [CandidatoService, JwtStrategy],
})
export class CandidatoModule {}
