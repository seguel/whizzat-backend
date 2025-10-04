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
    const equipe_whizzat = this.i18n.translate('common.mail.equipe_whizzat', {
      lang: language,
    });

    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: subject,
      html: `
        <div style="width: 60%; margin: 40px auto; font-family: Arial, sans-serif; line-height: 1.6; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
          
          <img src="https://whizzat-frontend.onrender.com/assets/logofull_whizzat.png" alt="Logo Whizzat"
            style="display: block; margin: 0 auto 20px; width: 180px; height: auto;" />

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${primeira_linha} ${name},
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${segunda_linha}
          </p>

          <div style="margin: 30px 0;">
            <a href="${activationLink}"
              style="background-color: #22c55e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              ${btn_ativa_conta}
            </a>
          </div>

          <p style="font-size: 14px; margin-bottom: 20px;">
            <strong>${link_valido_24h}</strong>
          </p>

          <p style="font-size: 14px; color: #555;">
           ${equipe_whizzat}
            
          </p>

        </div>
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
    const equipe_whizzat = this.i18n.translate('common.mail.equipe_whizzat', {
      lang: language,
    });

    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: subject,
      html: `
        <div style="width: 60%; margin: 40px auto; font-family: Arial, sans-serif; line-height: 1.6; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
          
          <img src="https://whizzat-frontend.onrender.com/assets/logofull_whizzat.png" alt="Logo Whizzat"
            style="display: block; margin: 0 auto 20px; width: 180px; height: auto;" />

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${primeira_linha_reset_senha} ${name}
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${segunda_linha_reset_senha}
          </p>

          <div style="margin: 30px 0;">
            <a href="${Link}"
              style="background-color: #22c55e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              ${btn_reset_Senha}
            </a>
          </div>

          <p style="font-size: 14px; margin-bottom: 20px;">
            <strong>${link_valido_15m}</strong>
          </p>

          <p style="font-size: 14px; color: #555;">
           ${equipe_whizzat}
            
          </p>

        </div>
  `,
    });

    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendWelcomeEmailAvaliador(
    email: string,
    name: string,
    name_empresa: string,
    activationLink: string,
    language: string,
  ) {
    const subject = this.i18n.translate(
      'common.mail.avaliador_assunto_bem_vindo',
      {
        lang: language,
      },
    );
    const primeira_linha = this.i18n.translate(
      'common.mail.avaliador_primeira_linha_bem_vindo',
      {
        lang: language,
      },
    );
    const segunda_linha = this.i18n.translate(
      'common.mail.avaliador_segunda_linha_bem_vindo',
      {
        lang: language,
      },
    );
    const segunda_linha_complemento = this.i18n.translate(
      'common.mail.avaliador_segunda_linha_complemento',
      {
        lang: language,
      },
    );
    const terceira_linha = this.i18n.translate(
      'common.mail.avaliador_terceira_linha_bem_vindo',
      {
        lang: language,
      },
    );
    const btn_ativa_conta = this.i18n.translate(
      'common.mail.avaliador_btn_ativa_conta',
      {
        lang: language,
      },
    );
    const link_valido_24h = this.i18n.translate(
      'common.mail.avaliador_link_valido_24h',
      {
        lang: language,
      },
    );
    const equipe_whizzat = this.i18n.translate(
      'common.mail.avaliador_equipe_whizzat',
      {
        lang: language,
      },
    );

    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: subject,
      html: `
        <div style="width: 60%; margin: 40px auto; font-family: Arial, sans-serif; line-height: 1.6; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
          
          <img src="https://whizzat-frontend.onrender.com/assets/logofull_whizzat.png" alt="Logo Whizzat"
            style="display: block; margin: 0 auto 20px; width: 180px; height: auto;" />

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${primeira_linha} ${name_empresa},
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${segunda_linha} <strong>${name}</strong>, ${segunda_linha_complemento}
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${terceira_linha}
          </p>

          <div style="margin: 30px 0;">
            <a href="${activationLink}"
              style="background-color: #22c55e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              ${btn_ativa_conta}
            </a>
          </div>

          <p style="font-size: 14px; margin-bottom: 20px;">
            <strong>${link_valido_24h}</strong>
          </p>

          <p style="font-size: 14px; color: #555;">
           ${equipe_whizzat}
            
          </p>

        </div>
  `,
    });

    if (error) {
      throw new Error(`Failed to send avaliador email: ${error.message}`);
    }
  }
}
