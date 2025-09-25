//import { Controller } from '@nestjs/common';
import {
  Param,
  Controller,
  Get,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AvaliadorService } from './avaliador.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Request } from 'express';
//import { usuario_perfil_avaliador } from '@prisma/client';

@Controller('avaliador')
export class AvaliadorController {
  constructor(private readonly avaliadorService: AvaliadorService) {}

  @UseGuards(JwtAuthGuard)
  @Get('check-hasperfil')
  checkPerfil(
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const usuarioId = req.user?.sub;

    return this.avaliadorService.getCheckHasPerfil(usuarioId, perfilId);
  }
}
