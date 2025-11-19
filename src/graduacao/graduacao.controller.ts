import {
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GraduacaoService } from './graduacao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('graduacao')
export class GraduacaoController {
  constructor(private readonly graduacaoService: GraduacaoService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getGraduacao(@Param('id', ParseIntPipe) id: number) {
    return this.graduacaoService.getGraduacao(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getGraduacoes(@Req() req: Request & { user: JwtPayload }) {
    const lang = req.user?.lang ?? 'pt';
    return this.graduacaoService.getGraduacoes(lang);
  }
}
