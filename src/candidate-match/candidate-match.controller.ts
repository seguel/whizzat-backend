import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { CandidateMatchService } from './candidate-match.service';
import { BuscarCandidatosVagaDto } from './dto/buscar-candidatos-vaga.dto';
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
}
