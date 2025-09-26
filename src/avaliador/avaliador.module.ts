import { Module } from '@nestjs/common';
import { AvaliadorController } from './avaliador.controller';
import { AvaliadorService } from './avaliador.service';
import { SkillModule } from '../skill/skill.module';

@Module({
  imports: [SkillModule],
  controllers: [AvaliadorController],
  providers: [AvaliadorService],
})
export class AvaliadorModule {}
