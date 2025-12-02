import {
  Param,
  Controller,
  Get,
  ParseIntPipe,
  Headers,
  Post,
} from '@nestjs/common';
import { EstadoService } from './estado.service';

@Controller('estados')
export class EstadoController {
  constructor(private readonly estadoService: EstadoService) {}

  @Get(':id')
  getEstado(@Param('id', ParseIntPipe) id: number) {
    return this.estadoService.getEstado(id);
  }

  @Get()
  getEstados(@Headers('accept-language') language: string) {
    return this.estadoService.getEstados(language);
  }

  @Post(':estadoId/:uf')
  async gerarCidades(
    @Param('estadoId') estadoId: string,
    @Param('uf') uf: string,
  ) {
    return this.estadoService.gerarCidades(Number(estadoId), uf.toUpperCase());
  }
}
