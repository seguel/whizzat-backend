import { Module } from '@nestjs/common';
import { GraduacaoService } from './graduacao.service';
import { GraduacaoController } from './graduacao.controller';

@Module({
  controllers: [GraduacaoController],
  providers: [GraduacaoService],
})
export class GraduacaoModule {}
