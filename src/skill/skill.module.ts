import { Module } from '@nestjs/common';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SkillController],
  providers: [SkillService, PrismaService],
  exports: [SkillService],
})
export class SkillModule {}
