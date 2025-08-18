import { Module } from '@nestjs/common';
import { PeriodoService } from './periodo.service';
import { PeriodoController } from './periodo.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PeriodoController],
  providers: [PeriodoService, PrismaService],
})
export class PeriodoModule {}
