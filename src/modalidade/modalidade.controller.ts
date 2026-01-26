import {
  Body,
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ModalidadeService } from './modalidade.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModalidadeTrabalho } from '@prisma/client';

@Controller('modalidades')
export class ModalidadeController {
  constructor(private readonly modalidadeService: ModalidadeService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getModalidade(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ModalidadeTrabalho | null> {
    return this.modalidadeService.getModalidade(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getModalidades(
    @Req() req: Request & { user: JwtPayload },
  ): Promise<ModalidadeTrabalho[]> {
    const lang = req.user?.lang ?? 'pt';
    return this.modalidadeService.getModalidades(lang);
  }
}
