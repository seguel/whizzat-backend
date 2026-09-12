import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { CandidateMatchService } from './candidate-match.service';
import { BuscarCandidatosVagaDto } from './dto/buscar-candidatos-vaga.dto';
import { IgnorarCandidatoDto } from './dto/ignorar-candidato.dto';
import { RestaurarCandidatosDto } from './dto/restaurar-candidatos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('candidate-match')
export class CandidateMatchController {
  constructor(private readonly candidateMatchService: CandidateMatchService) {}

  @UseGuards(JwtAuthGuard)
  @Post('vaga/:vagaId')
  async buscarPorVaga(
    @Req() req: Request & { user: JwtPayload },
    @Param('vagaId', ParseIntPipe) vagaId: number,
    @Body() body: BuscarCandidatosVagaDto,
  ) {
    const usuarioId = req.user.sub;
    const lang = req.user.lang ?? 'pt';

    return this.candidateMatchService.buscarPorVaga({
      vagaId,
      empresaId: body.empresa_id,
      usuarioId,
      lang,
      limite: body.limite,
      faixa: body.faixa,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('ignorar')
  async ignorarCandidato(
    @Req() req: Request & { user: JwtPayload },
    @Body() body: IgnorarCandidatoDto,
  ) {
    const usuarioId = req.user.sub;

    return this.candidateMatchService.ignorarCandidato({
      usuarioId,
      candidatoId: body.candidato_id,
      motivo: body.motivo ?? null,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('ignorados')
  async listarIgnorados(@Req() req: Request & { user: JwtPayload }) {
    return this.candidateMatchService.listarIgnorados(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('ignorados/:candidatoId/restaurar')
  async restaurarCandidato(
    @Req() req: Request & { user: JwtPayload },
    @Param('candidatoId', ParseIntPipe) candidatoId: number,
  ) {
    return this.candidateMatchService.restaurarCandidato({
      usuarioId: req.user.sub,
      candidatoId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('ignorados/restaurar')
  async restaurarCandidatos(
    @Req() req: Request & { user: JwtPayload },
    @Body() body: RestaurarCandidatosDto,
  ) {
    return this.candidateMatchService.restaurarCandidatos({
      usuarioId: req.user.sub,
      candidatoIds: body.candidato_ids,
    });
  }

  @Get('candidato/:candidatoId')
  @UseGuards(JwtAuthGuard)
  async buscarPerfilCandidato(
    @Req() req: Request & { user: JwtPayload },
    @Param('candidatoId', ParseIntPipe) candidatoId: number,
  ) {
    return this.candidateMatchService.buscarPerfilCandidato({
      usuarioId: req.user.sub,
      candidatoId,
    });
  }
}
