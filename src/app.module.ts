import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MailService } from './mail/mail.service';

@Module({
  imports: [PrismaModule, UserModule, AuthModule],
  providers: [MailService],
})
export class AppModule {}
