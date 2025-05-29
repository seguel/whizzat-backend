import { Injectable } from '@nestjs/common';
//import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendWelcomeEmail(email: string, name: string, activationLink: string) {
    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: 'Confirme seu cadastro',
      html: `
      <p>Olá ${name},</p>
      <p>Obrigado por se cadastrar! Por favor, confirme seu e-mail clicando no botão abaixo:</p>
      <a href="${activationLink}" style="background-color: #22c55e; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Ativar Conta</a>
      <p>Este link é válido por 24 horas.</p>
    `,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }
  }

  async sendPasswordResetEmail(email: string, name: string, Link: string) {
    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: 'Redefina sua senha',
      html: `
      <p>Olá ${name},</p>
      <p>Redefina sua senha clicando no botão abaixo:</p>
      <a href="${Link}" style="background-color: #22c55e; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
      <p>Este link é válido por 15 minutos.</p>
    `,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }
  }
}
