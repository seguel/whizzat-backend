import { Module } from '@nestjs/common';
import { RecrutadorService } from './recrutador.service';
import { RecrutadorController } from './recrutador.controller';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UserModule, AuthModule],
  controllers: [RecrutadorController],
  providers: [RecrutadorService],
})
export class RecrutadorModule {}
