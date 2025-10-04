import { Module } from '@nestjs/common';
import { AvaliadorController } from './avaliador.controller';
import { AvaliadorService } from './avaliador.service';
import { SkillModule } from '../skill/skill.module';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key',
      signOptions: { expiresIn: '1d' },
    }),
    MailModule,
    SkillModule,
  ],
  controllers: [AvaliadorController],
  providers: [AvaliadorService, JwtStrategy],
})
export class AvaliadorModule {}
