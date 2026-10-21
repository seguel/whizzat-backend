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
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state,
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

    const calendar = google.calendar({
      version: 'v3',
      auth: oauth2Client,
    });

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
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

    return {
      eventoId: evento.id,
      titulo: evento.summary,
      linkMeet:
        evento.hangoutLink ||
        evento.conferenceData?.entryPoints?.find(
          (entry) => entry.entryPointType === 'video',
        )?.uri,
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
}
