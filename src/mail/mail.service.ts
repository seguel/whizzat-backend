import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  constructor(private readonly i18n: I18nService) {}

  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendWelcomeEmail(
    email: string,
    name: string,
    activationLink: string,
    language: string,
  ) {
    const subject = this.i18n.translate('common.mail.assunto_bem_vindo', {
      lang: language,
    });
    const primeira_linha = this.i18n.translate(
      'common.mail.primeira_linha_bem_vindo',
      {
        lang: language,
      },
    );
    const segunda_linha = this.i18n.translate(
      'common.mail.segunda_linha_bem_vindo',
      {
        lang: language,
      },
    );
    const btn_ativa_conta = this.i18n.translate('common.mail.btn_ativa_conta', {
      lang: language,
    });
    const link_valido_24h = this.i18n.translate('common.mail.link_valido_24h', {
      lang: language,
    });

    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: subject,
      html: `
      <p>${primeira_linha} ${name},</p>
      <p>${segunda_linha}</p>
      <a href="${activationLink}" style="background-color: #22c55e; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">${btn_ativa_conta}</a>
      <p>${link_valido_24h}</p>
    `,
    });

    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    Link: string,
    language: string,
  ) {
    const subject = this.i18n.translate('common.mail.assunto_reset_senha', {
      lang: language,
    });
    const primeira_linha_reset_senha = this.i18n.translate(
      'common.mail.primeira_linha_reset_senha',
      {
        lang: language,
      },
    );
    const segunda_linha_reset_senha = this.i18n.translate(
      'common.mail.segunda_linha_reset_senha',
      {
        lang: language,
      },
    );
    const btn_reset_Senha = this.i18n.translate('common.mail.btn_reset_Senha', {
      lang: language,
    });
    const link_valido_15m = this.i18n.translate('common.mail.link_valido_15m', {
      lang: language,
    });

    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: subject,
      html: `
      <p>${primeira_linha_reset_senha} ${name},</p>
      <p>${segunda_linha_reset_senha}</p>
      <a href="${Link}" style="background-color: #22c55e; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">${btn_reset_Senha}</a>
      <p>${link_valido_15m}</p>
    `,
    });

    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    /* const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: await this.i18n.translate('common.mail.PASSWORD_RESET_SENT', {
        language,
      }), //'Redefina sua senha',
      html: `
      <p>Olá ${name},</p>
      <p>Redefina sua senha clicando no botão abaixo:</p>
      <a href="${Link}" style="background-color: #22c55e; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
      <p>Este link é válido por 15 minutos.</p>
    `,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    } */
  }
}
