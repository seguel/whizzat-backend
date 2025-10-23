import {
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { GraduacaoService } from './graduacao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  getGraduacoes() {
    return this.graduacaoService.getGraduacoes();
  }
}
