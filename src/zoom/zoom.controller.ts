import { Controller, Get } from '@nestjs/common';
import { ZoomService } from './zoom.service';

@Controller('zoom')
export class ZoomController {
  constructor(private readonly zoomService: ZoomService) {}

  @Get('teste')
  async testarCriacaoReuniao() {
    // const inicio = new Date(Date.now() + 60 * 60 * 1000);

    // const reuniao = await this.zoomService.criarEntrevistaZoom(
    //   'Whizzat - Teste de Entrevista',
    //   'Reunião de teste da integração Zoom com Whizzat.',
    //   inicio,
    //   30,
    // );

    return {
      sucesso: true,
      // meeting_id: reuniao.id,
      // link_reuniao: reuniao.link,
    };
  }
}
