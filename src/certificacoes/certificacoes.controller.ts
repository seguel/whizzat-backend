import {
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CertificacoesService } from './certificacoes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('certificacoes')
export class CertificacoesController {
  constructor(private readonly certificacoesService: CertificacoesService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getCertificado(@Param('id', ParseIntPipe) id: number) {
    return this.certificacoesService.getCertificado(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getCertificados() {
    return this.certificacoesService.getCertificados();
  }
}
