import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService], // Não esquecer de exportar o serviço para ser usado em outros módulos
})
export class MailModule {}
