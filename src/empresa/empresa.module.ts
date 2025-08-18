// src/empresa/empresa.module.ts
import { Module } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SkillModule } from '../skill/skill.module';

@Module({
  imports: [SkillModule],
  controllers: [EmpresaController],
  providers: [EmpresaService, PrismaService],
})
export class EmpresaModule {}
