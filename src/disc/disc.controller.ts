import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { DiscService } from './disc.service';
import { SalvarDiscRespostaDto } from './dto/salvar-disc-resposta.dto';
import { IniciarDiscDto } from './dto/iniciar-disc.dto';
import { AtualizarCompartilhamentoDiscDto } from './dto/atualizar-compartilhamento-disc.dto';

@UseGuards(JwtAuthGuard)
@Controller('disc')
export class DiscController {
  constructor(private readonly discService: DiscService) {}

  @Get('questionario')
  buscarQuestionario() {
    return this.discService.buscarQuestionario();
  }

  @Get('minha-aplicacao')
  buscarMinhaAplicacao(@Req() req: Request & { user: JwtPayload }) {
    return this.discService.buscarMinhaAplicacao(req.user.sub);
  }

  @Post('iniciar')
  iniciar(
    @Req() req: Request & { user: JwtPayload },
    @Body() body: IniciarDiscDto,
  ) {
    return this.discService.iniciar(req.user.sub, body.consentimento);
  }

  @Patch('aplicacoes/:id/resposta')
  salvarResposta(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) aplicacaoId: number,
    @Body() body: SalvarDiscRespostaDto,
  ) {
    return this.discService.salvarResposta(req.user.sub, aplicacaoId, body);
  }

  @Post('aplicacoes/:id/finalizar')
  finalizar(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) aplicacaoId: number,
  ) {
    return this.discService.finalizar(req.user.sub, aplicacaoId);
  }

  @Get('meu-resultado')
  buscarMeuResultado(@Req() req: Request & { user: JwtPayload }) {
    return this.discService.buscarMeuResultado(req.user.sub);
  }

  @Patch('minha-aplicacao/compartilhamento')
  atualizarCompartilhamento(
    @Req() req: Request & { user: JwtPayload },
    @Body() body: AtualizarCompartilhamentoDiscDto,
  ) {
    return this.discService.atualizarCompartilhamento(
      Number(req.user.sub),
      body.compartilhar_recrutador,
    );
  }
}
