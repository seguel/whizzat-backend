import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);

  constructor(private readonly configService: ConfigService) {}

  private async obterAccessToken(): Promise<string> {
    const accountId = this.configService.get<string>('ZOOM_ACCOUNT_ID');
    const clientId = this.configService.get<string>('ZOOM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET');

    if (!accountId || !clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Credenciais do Zoom não configuradas.',
      );
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const url = new URL('https://zoom.us/oauth/token');
    url.searchParams.set('grant_type', 'account_credentials');
    url.searchParams.set('account_id', accountId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const erro = await response.text();
      this.logger.error(`Erro ao autenticar no Zoom: ${erro}`);

      throw new InternalServerErrorException(
        'Não foi possível autenticar no Zoom.',
      );
    }

    const data = await response.json();

    return data.access_token;
  }

  async criarEntrevistaZoom(
    titulo: string,
    descricao: string,
    dataInicio: Date,
    duracaoMinutos = 60,
  ) {
    const token = await this.obterAccessToken();

    const userId = this.configService.get<string>('ZOOM_USER_ID');

    if (!userId) {
      throw new InternalServerErrorException('Usuário Zoom não configurado.');
    }

    const response = await fetch(
      `https://api.zoom.us/v2/users/${encodeURIComponent(userId)}/meetings`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: titulo,
          agenda: descricao,
          type: 2,
          start_time: dataInicio.toISOString(),
          duration: duracaoMinutos,
          timezone: 'America/Sao_Paulo',
          settings: {
            waiting_room: false,
            join_before_host: true,
            jbh_time: 0,
            host_video: true,
            participant_video: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const erro = await response.text();
      this.logger.error(`Erro ao criar reunião Zoom: ${erro}`);

      throw new InternalServerErrorException(
        'Não foi possível criar a reunião Zoom.',
      );
    }

    const reuniao = await response.json();

    this.logger.log(`Reunião Zoom criada: ${reuniao.id}`);

    return {
      id: String(reuniao.id),
      link: reuniao.join_url,
      start_url: reuniao.start_url,
    };
  }

  async cancelarReuniaoZoom(meetingId: string): Promise<void> {
    const token = await this.obterAccessToken();

    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 404) {
      this.logger.warn(`Reunião Zoom ${meetingId} não encontrada.`);
      return;
    }

    if (!response.ok) {
      const erro = await response.text();

      this.logger.error(`Erro ao cancelar reunião Zoom ${meetingId}: ${erro}`);

      throw new InternalServerErrorException(
        'Não foi possível cancelar a reunião Zoom.',
      );
    }

    this.logger.log(`Reunião Zoom ${meetingId} cancelada.`);
  }
}
