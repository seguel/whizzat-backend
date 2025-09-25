import { Module } from '@nestjs/common';
import { AvaliadorController } from './avaliador.controller';
import { AvaliadorService } from './avaliador.service';

@Module({
  controllers: [AvaliadorController],
  providers: [AvaliadorService],
})
export class AvaliadorModule {}
