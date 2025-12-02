import { Param, Controller, Get, ParseIntPipe } from '@nestjs/common';
import { CidadeService } from './cidade.service';

@Controller('cidades')
export class CidadeController {
  constructor(private readonly cidadeService: CidadeService) {}

  @Get(':id')
  getCidade(@Param('id', ParseIntPipe) id: number) {
    return this.cidadeService.getCidade(id);
  }

  @Get('estado-cidade/:estado_id')
  getCidades(@Param('estado_id', ParseIntPipe) estado_id: number) {
    return this.cidadeService.getCidades(estado_id);
  }
}
