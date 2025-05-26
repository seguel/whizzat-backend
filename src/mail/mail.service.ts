import { Injectable } from '@nestjs/common';
//import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendWelcomeEmail(email: string, name: string, activationLink: string) {
    await this.resend.emails.send({
      from: '"Whizzat" <onboarding@resend.dev>',
      to: email,
      subject: 'Confirme seu cadastro',
      html: `
      <p>Olá ${name},</p>
      <p>Obrigado por se cadastrar! Por favor, confirme seu e-mail clicando no botão abaixo:</p>
      <a href="${activationLink}" style="background-color: #22c55e; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Ativar Conta</a>
      <p>Este link é válido por 24 horas.</p>
    `,
    });
  }
}
