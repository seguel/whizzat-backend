import { Module } from '@nestjs/common';
import { CertificacoesService } from './certificacoes.service';
import { CertificacoesController } from './certificacoes.controller';

@Module({
  controllers: [CertificacoesController],
  providers: [CertificacoesService],
  exports: [CertificacoesService],
})
export class CertificacoesModule {}
