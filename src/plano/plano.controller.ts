import {
  Body,
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
  Req,
  Post,
  Query,
  Headers,
} from '@nestjs/common';
import { PlanoService } from './plano.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { plano } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';

@Controller('planos')
export class PlanoController {
  constructor(
    private readonly planoService: PlanoService,
    private readonly i18n: I18nService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getPlano(@Param('id', ParseIntPipe) id: number): Promise<plano | null> {
    return this.planoService.getPlano(id);
  }

  @Get()
  getPlanos(
    @Headers('accept-language') language: string,
    @Req() req: Request & { user: JwtPayload },
    @Query('perfilId') perfilId?: string,
  ) {
    const lang = req.user?.lang ?? language;
    return this.planoService.getPlanos(
      lang,
      perfilId ? Number(perfilId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  postPlano(
    @Body()
    body: {
      perfilId: number;
      planoPeriodoId: number;
      token_pagto: string;
    },
    @Req() req: Request & { user: JwtPayload },
  ) {
    const userId = req.user?.sub;
    const lang = req.user?.lang ?? 'pt';
    return this.planoService.postPlano(
      userId,
      body.perfilId,
      body.planoPeriodoId,
      lang,
      body.token_pagto,
    );
  }
}
