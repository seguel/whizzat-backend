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
            ${primeira_linha} <strong>${name}</strong>,
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
            ${primeira_linha_reset_senha} <strong>${name}</strong>
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

  async sendRequestRegisterAvaliador(
    email: string,
    name: string,
    name_empresa: string,
    activationLink: string,
    rejectLink: string,
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
    const quarta_linha = this.i18n.translate(
      'common.mail.avaliador_quarta_linha_bem_vindo',
      {
        lang: language,
      },
    );
    const btn_rejeita_conta = this.i18n.translate(
      'common.mail.avaliador_btn_rejeita_conta',
      {
        lang: language,
      },
    );
    const link_valido_72h = this.i18n.translate(
      'common.mail.avaliador_link_valido_72h',
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

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${quarta_linha}
          </p>

          <div style="margin: 30px 0;">
            <a href="${rejectLink}"
              style="background-color: #c52222ff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              ${btn_rejeita_conta}
            </a>
          </div>

          <p style="font-size: 14px; margin-bottom: 20px;">
            <strong>${link_valido_72h}</strong>
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

  async sendWelcomeAvaliador(
    email: string,
    name: string,
    empresa: string,
    language: string,
  ) {
    const subject = this.i18n.translate(
      'common.mail.avaliador_welcome_assunto',
      {
        lang: language,
      },
    );
    const primeira_linha = this.i18n.translate(
      'common.mail.avaliador_welcome_primeira_linha',
      {
        lang: language,
      },
    );
    const segunda_linha = this.i18n.translate(
      'common.mail.avaliador_welcome_segunda_linha',
      {
        lang: language,
      },
    );
    const segunda_linha_complemento = this.i18n.translate(
      'common.mail.avaliador_welcome_segunda_linha_complemento',
      {
        lang: language,
      },
    );
    const terceira_linha = this.i18n.translate(
      'common.mail.avaliador_welcome_terceira_linha',
      {
        lang: language,
      },
    );
    const quarta_linha = this.i18n.translate(
      'common.mail.avaliador_welcome_quarta_linha',
      {
        lang: language,
      },
    );
    const equipe_whizzat = this.i18n.translate(
      'common.mail.avaliador_welcome_equipe_whizzat',
      {
        lang: language,
      },
    );

    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: subject,
      html: `
        <div style="width: 60%; margin: 40px auto; font-family: Arial, sans-serif; line-height: 1.6; text-align: left; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
          
          <img src="https://whizzat-frontend.onrender.com/assets/logofull_whizzat.png" alt="Logo Whizzat"
            style="display: block; margin: 0 auto 20px; width: 180px; height: auto;" />

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${primeira_linha} ${name},
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${segunda_linha} <strong>${empresa}</strong> ${segunda_linha_complemento}
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${terceira_linha}
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${quarta_linha}
          </p>

          <p style="font-size: 14px; color: #555;">
           ${equipe_whizzat}
            
          </p>

        </div>
  `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendRejectAvaliador(
    email: string,
    name: string,
    empresa: string,
    language: string,
  ) {
    const subject = this.i18n.translate(
      'common.mail.avaliador_reject_assunto',
      {
        lang: language,
      },
    );
    const primeira_linha = this.i18n.translate(
      'common.mail.avaliador_reject_primeira_linha',
      {
        lang: language,
      },
    );
    const segunda_linha = this.i18n.translate(
      'common.mail.avaliador_reject_segunda_linha',
      {
        lang: language,
      },
    );
    const terceira_linha = this.i18n.translate(
      'common.mail.avaliador_reject_terceira_linha',
      {
        lang: language,
      },
    );
    const quarta_linha = this.i18n.translate(
      'common.mail.avaliador_reject_quarta_linha',
      {
        lang: language,
      },
    );
    const equipe_whizzat = this.i18n.translate(
      'common.mail.avaliador_welcome_equipe_whizzat',
      {
        lang: language,
      },
    );

    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: subject,
      html: `
        <div style="width: 60%; margin: 40px auto; font-family: Arial, sans-serif; line-height: 1.6; text-align: left; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
          
          <img src="https://whizzat-frontend.onrender.com/assets/logofull_whizzat.png" alt="Logo Whizzat"
            style="display: block; margin: 0 auto 20px; width: 180px; height: auto;" />

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${primeira_linha} ${name},
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${segunda_linha} <strong>${empresa}</strong>
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${terceira_linha}
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            ${quarta_linha}
          </p>

          <p style="font-size: 14px; color: #555;">
           ${equipe_whizzat}
            
          </p>

        </div>
  `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async enviarResumoNotificacoes(
    email: string,
    nome: string,
    language: string,
    quantidade: number,
    dashboardLink: string,
  ) {
    const subjectPrefixo = this.i18n.translate(
      'common.mail.resumo_notificacoes.assunto_prefixo',
      { lang: language },
    );

    const subjectSufixo = this.i18n.translate(
      'common.mail.resumo_notificacoes.assunto_sufixo',
      { lang: language },
    );

    const subject = `${subjectPrefixo} ${quantidade} ${subjectSufixo}`;

    const { error } = await this.resend.emails.send({
      from: '"Whizzat" <no-reply@whizzat.com.br>',
      to: email,
      subject: subject,
      html: `
<div style="width: 100%; background-color: #f4f6f8; padding: 40px 0; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 35px; border: 1px solid #e5e7eb;">
    
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="https://whizzat-frontend.onrender.com/assets/logofull_whizzat.png" 
           alt="Whizzat" 
           style="width: 170px; height: auto;" />
    </div>

    <h2 style="font-size: 22px; color: #111827; text-align: center; margin-bottom: 25px;">
      ${this.i18n.translate('common.mail.resumo_notificacoes.titulo', { lang: language })}
    </h2>

    <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">
      ${this.i18n.translate('common.mail.resumo_notificacoes.saudacao', { lang: language })} <strong>${nome}</strong>,
    </p>

    <p style="font-size: 15px; color: #4b5563; margin-bottom: 20px;">
      ${this.i18n.translate('common.mail.resumo_notificacoes.introducao', { lang: language })}
    </p>

    <!-- BLOCO PRINCIPAL -->
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
                padding: 25px; border-radius: 10px; margin-bottom: 30px; text-align: center; border: 1px solid #bbf7d0;">
      
      <div style="font-size: 36px; font-weight: bold; color: #16a34a; margin-bottom: 5px;">
        ${quantidade}
      </div>

      <div style="font-size: 15px; color: #065f46; font-weight: 600;">
        ${this.i18n.translate('common.mail.resumo_notificacoes.skills_pendentes', { lang: language })}
      </div>

      <div style="margin-top: 12px; font-size: 13px; color: #047857;">
        ⏳ ${this.i18n.translate('common.mail.resumo_notificacoes.prazo_resumido', { lang: language })}
      </div>
    </div>

    <!-- TEXTO DE REGRAS -->
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 25px; line-height: 1.6;">
      ${this.i18n.translate('common.mail.resumo_notificacoes.regra_concorrencia', { lang: language })}
    </p>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 35px;">
      <a href="${dashboardLink}"
         style="background-color: #16a34a; 
                color: #ffffff; 
                padding: 14px 28px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold; 
                font-size: 15px;
                display: inline-block;">
         ${this.i18n.translate('common.mail.resumo_notificacoes.btn_acessar', { lang: language })}
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />

    <p style="font-size: 13px; color: #9ca3af; text-align: center;">
      ${this.i18n.translate('common.mail.resumo_notificacoes.rodape', { lang: language })}
    </p>

  </div>
</div>
`,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
