import {
  Body,
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ModalidadeService } from './modalidade.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { modalidade_trabalho } from '@prisma/client';

@Controller('modalidades')
export class ModalidadeController {
  constructor(private readonly modalidadeService: ModalidadeService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getModalidade(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<modalidade_trabalho | null> {
    return this.modalidadeService.getModalidade(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getModalidades(): Promise<modalidade_trabalho[]> {
    return this.modalidadeService.getModalidades();
  }
}
