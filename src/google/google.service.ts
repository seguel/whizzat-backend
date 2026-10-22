import { Injectable, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';
import { randomBytes } from 'crypto';

@Injectable()
export class GoogleService {
  private oauth2Client;
  private readonly pendingStates = new Map<string, number>();

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  gerarUrlAutorizacao() {
    const state = randomBytes(32).toString('hex');

    // Estado temporário válido por 10 minutos
    this.pendingStates.set(state, Date.now() + 10 * 60 * 1000);

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/meetings.space.settings',
      ],
    });
  }

  async obterTokens(code: string, state: string) {
    const expiresAt = this.pendingStates.get(state);
    this.pendingStates.delete(state);

    if (!expiresAt || Date.now() > expiresAt) {
      throw new BadRequestException('Estado OAuth inválido ou expirado');
    }

    const { tokens } = await this.oauth2Client.getToken(code);

    return {
      refresh_token: tokens.refresh_token,
      access_token_recebido: !!tokens.access_token,
    };
  }

  async criarEntrevistaGoogleMeet(
    titulo: string,
    descricao: string,
    dataInicio: string,
    dataFim: string,
  ) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const calendar = google.calendar({
      version: 'v3',
      auth: oauth2Client,
    });

    const response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: titulo,
        description: descricao,
        start: {
          dateTime: dataInicio,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: dataFim,
          timeZone: 'America/Sao_Paulo',
        },
        conferenceData: {
          createRequest: {
            requestId: randomBytes(16).toString('hex'),
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      },
    });

    const evento = response.data;

    const linkMeet =
      evento.hangoutLink ||
      evento.conferenceData?.entryPoints?.find(
        (entry) => entry.entryPointType === 'video',
      )?.uri;

    if (!evento.id || !linkMeet) {
      if (evento.id) {
        await calendar.events.delete({
          calendarId,
          eventId: evento.id,
        });
      }

      throw new Error(
        'O Google Calendar não retornou um link válido para o Meet.',
      );
    }

    try {
      const accessToken = await oauth2Client.getAccessToken();

      if (!accessToken.token) {
        throw new Error('Não foi possível obter o token do Google.');
      }

      await this.configurarAcessoLivreMeet(linkMeet, accessToken.token);
    } catch (error) {
      // Remove o evento criado caso não consiga configurar o acesso.
      try {
        await calendar.events.delete({
          calendarId,
          eventId: evento.id,
        });
      } catch (erroCancelamento) {
        console.error(
          'Erro ao cancelar evento Google após falha na configuração do Meet:',
          erroCancelamento,
        );
      }

      throw error;
    }

    return {
      eventoId: evento.id,
      titulo: evento.summary,
      linkMeet,
      linkCalendar: evento.htmlLink,
      statusConferencia:
        evento.conferenceData?.createRequest?.status?.statusCode,
    };
  }

  async cancelarEventoGoogle(eventoId: string): Promise<void> {
    if (!eventoId?.trim()) {
      throw new BadRequestException('ID do evento Google não informado.');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({
      version: 'v3',
      auth: oauth2Client,
    });

    try {
      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId: eventoId,
        sendUpdates: 'none',
      });
    } catch (error: unknown) {
      const erroGoogle = error as {
        response?: {
          status?: number;
        };
        code?: number | string;
      };

      const status = erroGoogle.response?.status ?? erroGoogle.code;

      // Evento já excluído ou inexistente
      if (Number(status) === 404) {
        return;
      }

      throw error;
    }
  }

  private async configurarAcessoLivreMeet(
    linkMeet: string,
    accessToken: string,
  ): Promise<void> {
    const codigoMeet = new URL(linkMeet).pathname.split('/').filter(Boolean)[0];

    if (!codigoMeet) {
      throw new Error('Código do Google Meet não encontrado.');
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Busca o identificador real do espaço.
    const consulta = await fetch(
      `https://meet.googleapis.com/v2/spaces/${encodeURIComponent(codigoMeet)}`,
      { headers },
    );

    if (!consulta.ok) {
      throw new Error(
        `Erro ao consultar Google Meet: ${consulta.status} - ${await consulta.text()}`,
      );
    }

    const espaco = (await consulta.json()) as {
      name: string;
    };

    // Atualiza as configurações da reunião.
    const resposta = await fetch(
      `https://meet.googleapis.com/v2/${espaco.name}?updateMask=config.accessType,config.moderation`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          config: {
            accessType: 'OPEN',
            moderation: 'OFF',
          },
        }),
      },
    );

    if (!resposta.ok) {
      throw new Error(
        `Erro ao liberar acesso ao Google Meet: ${resposta.status} - ${await resposta.text()}`,
      );
    }
  }
}
