import { Module } from '@nestjs/common';
import { RecrutadorService } from './recrutador.service';
import { RecrutadorController } from './recrutador.controller';

@Module({
  controllers: [RecrutadorController],
  providers: [RecrutadorService],
})
export class RecrutadorModule {}
