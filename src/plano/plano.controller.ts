import {
  Body,
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
  Req,
  Post,
} from '@nestjs/common';
import { PlanoService } from './plano.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { plano } from '@prisma/client';

@Controller('planos')
export class PlanoController {
  constructor(private readonly planoService: PlanoService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getPlano(@Param('id', ParseIntPipe) id: number): Promise<plano | null> {
    return this.planoService.getPlano(id);
  }

  @Get()
  getPlanos(@Req() req: Request & { user: JwtPayload }) {
    const lang = req.user?.lang ?? 'pt';
    return this.planoService.getPlanos(lang);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  postPlano(
    @Body() body: { perfilId: number; planoPeriodoId: number },
    @Req() req: Request & { user: JwtPayload },
  ) {
    const userId = req.user?.sub;
    return this.planoService.postPlano(
      userId,
      body.perfilId,
      body.planoPeriodoId,
    );
  }
}
