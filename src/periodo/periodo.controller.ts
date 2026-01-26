import {
  Body,
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PeriodoService } from './periodo.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PeriodoTrabalho } from '@prisma/client';

@Controller('Periodos')
export class PeriodoController {
  constructor(private readonly periodoService: PeriodoService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getPeriodo(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PeriodoTrabalho | null> {
    return this.periodoService.getPeriodo(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getPeriodos(
    @Req() req: Request & { user: JwtPayload },
  ): Promise<PeriodoTrabalho[]> {
    const lang = req.user?.lang ?? 'pt';
    return this.periodoService.getPeriodos(lang);
  }
}
