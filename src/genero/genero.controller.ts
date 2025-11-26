import { Param, Controller, Get, ParseIntPipe, Headers } from '@nestjs/common';
import { GeneroService } from './genero.service';

@Controller('generos')
export class GeneroController {
  constructor(private readonly generoService: GeneroService) {}

  @Get(':id')
  getGenero(@Param('id', ParseIntPipe) id: number) {
    return this.generoService.getGenero(id);
  }

  @Get()
  getGeneros(@Headers('accept-language') language: string) {
    return this.generoService.getGeneros(language);
  }
}
