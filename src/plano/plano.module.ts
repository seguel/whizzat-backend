// src/plano/plano.module.ts
import { Module } from '@nestjs/common';
import { PlanoService } from './plano.service';
import { PlanoController } from './plano.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PlanoController],
  providers: [PlanoService, PrismaService],
  exports: [PlanoService], // ← necessário para que outros módulos usem o serviço
})
export class PlanoModule {}
