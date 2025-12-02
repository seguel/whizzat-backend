import { Module } from '@nestjs/common';
import { RecrutadorService } from './recrutador.service';
import { RecrutadorController } from './recrutador.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [RecrutadorController],
  providers: [RecrutadorService],
})
export class RecrutadorModule {}
