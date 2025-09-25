import { Module } from '@nestjs/common';
import { VagaService } from './vaga.service';
import { VagaController } from './vaga.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SkillModule } from '../skill/skill.module';

@Module({
  imports: [SkillModule],
  controllers: [VagaController],
  providers: [VagaService, PrismaService],
})
export class VagaModule {}
