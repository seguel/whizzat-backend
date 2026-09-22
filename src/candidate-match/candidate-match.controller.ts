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
import { BuscarCandidatosDto } from './dto/buscar-candidatos.dto';
import { CriarConviteVagaDto } from './dto/criar-convite-vaga.dto';
import { CriarConviteManualDto } from './dto/criar-convite-manual.dto';
import { ResponderConviteCandidatoDto } from './dto/responder-convite-candidato.dto';
import { ResponderAgendaCandidatoDto } from './dto/responder-agenda-candidato.dto';
import { SugerirAgendaRecrutadorDto } from './dto/sugerir-agenda-recrutador.dto';
import { FinalizarProcessoRecrutadorDto } from './dto/finalizar-processo-recrutador.dto';
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

  @UseGuards(JwtAuthGuard)
  @Post('busca')
  async buscarCandidatos(
    @Req() req: Request & { user: JwtPayload },
    @Body() body: BuscarCandidatosDto,
  ) {
    return this.candidateMatchService.buscarManual({
      usuarioId: req.user.sub,
      criterios: body,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('convite/vaga')
  async criarConviteVaga(
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CriarConviteVagaDto,
  ) {
    return this.candidateMatchService.criarConviteVaga({
      usuarioId: req.user.sub,
      dados: body,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('convites')
  async criarConvites(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CriarConviteManualDto,
  ) {
    return this.candidateMatchService.criarConvites(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('candidato/convites')
  async buscarConvitesCandidato(@Req() req: Request & { user: JwtPayload }) {
    return this.candidateMatchService.buscarConvitesCandidato(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('candidato/convites/:conviteId/resposta')
  async responderConviteCandidato(
    @Req() req: Request & { user: JwtPayload },
    @Param('conviteId', ParseIntPipe) conviteId: number,
    @Body() dto: ResponderConviteCandidatoDto,
  ) {
    return this.candidateMatchService.responderConviteCandidato({
      usuarioId: req.user.sub,
      conviteId,
      resposta: dto.resposta,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('candidato/processos')
  async buscarProcessosCandidato(@Req() req: Request & { user: JwtPayload }) {
    return this.candidateMatchService.buscarProcessosCandidato(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('candidato/processos/:conviteId/agenda/resposta')
  async responderAgendaCandidato(
    @Req() req: Request & { user: JwtPayload },
    @Param('conviteId', ParseIntPipe) conviteId: number,
    @Body() dto: ResponderAgendaCandidatoDto,
  ) {
    return this.candidateMatchService.responderAgendaCandidato({
      usuarioId: req.user.sub,
      conviteId,
      resposta: dto.resposta,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('candidato/finalizados')
  async buscarFinalizadosCandidato(@Req() req: Request & { user: JwtPayload }) {
    return this.candidateMatchService.buscarFinalizadosCandidato(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recrutador/processos')
  async buscarProcessosRecrutador(@Req() req: Request & { user: JwtPayload }) {
    return this.candidateMatchService.buscarProcessosRecrutador(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('recrutador/processos/:conviteId/agenda')
  async sugerirAgendaRecrutador(
    @Req() req: Request & { user: JwtPayload },
    @Param('conviteId', ParseIntPipe) conviteId: number,
    @Body() dto: SugerirAgendaRecrutadorDto,
  ) {
    return this.candidateMatchService.sugerirAgendaRecrutador({
      usuarioId: req.user.sub,
      conviteId,
      dataHoraAgenda: dto.data_hora_agenda,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('recrutador/processos/:conviteId/realizada')
  marcarEntrevistaRealizada(
    @Req() req: Request & { user: JwtPayload },
    @Param('conviteId', ParseIntPipe) conviteId: number,
  ) {
    const usuarioId = req.user.sub;

    return this.candidateMatchService.marcarEntrevistaRealizada(
      usuarioId,
      conviteId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('recrutador/processos/:conviteId/finalizar')
  finalizarProcesso(
    @Req() req: Request & { user: JwtPayload },
    @Param('conviteId', ParseIntPipe) conviteId: number,
    @Body() dto: FinalizarProcessoRecrutadorDto,
  ) {
    const usuarioId = req.user.sub;

    return this.candidateMatchService.finalizarProcessoRecrutador(
      usuarioId,
      conviteId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('recrutador/convites')
  listarConvitesRecrutador(@Req() req: Request & { user: JwtPayload }) {
    const usuarioId = req.user.sub;

    return this.candidateMatchService.listarConvitesRecrutador(usuarioId);
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
