import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { GoogleService } from './google.service';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('oauth')
  iniciarAutorizacao(@Res() res: Response) {
    const url = this.googleService.gerarUrlAutorizacao();
    return res.redirect(url);
  }

  @Get('oauth/callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Code ou state ausente');
    }

    const tokens = await this.googleService.obterTokens(code, state);

    // Exibido apenas no teste local para configurar o .env.
    // Nunca retornar refresh_token em uma rota pública de produção.
    return res.json(tokens);
  }

  @Get('teste-entrevista')
  async testarEntrevista() {
    const inicio = new Date(Date.now() + 60 * 60 * 1000);
    const fim = new Date(inicio.getTime() + 30 * 60 * 1000);

    return this.googleService.criarEntrevistaGoogleMeet(
      'Entrevista Teste - Whizzat',
      'Primeira entrevista criada automaticamente pelo Whizzat.',
      inicio.toISOString(),
      fim.toISOString(),
    );
  }
}
