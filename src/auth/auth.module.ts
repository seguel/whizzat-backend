import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key',
      signOptions: { expiresIn: '1d' },
    }),
    MailModule,
    forwardRef(() => UserModule), // 👈 aqui também
  ],
  providers: [AuthService, JwtStrategy, PrismaService],
  controllers: [AuthController],
  exports: [JwtModule, AuthService], // 👈 exporta JwtModule para outros módulos usarem
})
export class AuthModule {}
