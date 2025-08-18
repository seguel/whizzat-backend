import {
  Body,
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PeriodoService } from './periodo.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { periodo_trabalho } from '@prisma/client';

@Controller('Periodos')
export class PeriodoController {
  constructor(private readonly periodoService: PeriodoService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getPeriodo(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<periodo_trabalho | null> {
    return this.periodoService.getPeriodo(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getPeriodos(): Promise<periodo_trabalho[]> {
    return this.periodoService.getPeriodos();
  }
}
