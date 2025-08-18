// src/Modalidade/Modalidade.module.ts
import { Module } from '@nestjs/common';
import { ModalidadeService } from './modalidade.service';
import { ModalidadeController } from './modalidade.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ModalidadeController],
  providers: [ModalidadeService, PrismaService],
})
export class ModalidadeModule {}
