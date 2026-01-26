import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { generateActivationToken72 } from '../lib/util';
import { I18nService } from 'nestjs-i18n';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';
// import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  empresaId: number;
}

export interface CheckPerfil {
  id: number | null;
  usuario_id: number;
  redirect_to: string;
}

export interface CheckPerfilCadastro {
  id: number | null;
  usuario_id: number;
  nome_user: string;
}

export interface UsuarioDto {
  primeiro_nome: string;
  ultimo_nome: string;
  nome_social: string;
  data_nascimento: string | null;
  genero_id: number;
  genero: string;
  cidade_id: number;
  cidade: string;
  estado_id: number | null;
  estado: string;
}

export interface AvaliadorSkillDto {
  id: number;
  avaliador_id: number;
  skill_id: number;
  peso: number;
  favorito: boolean;
  tempo_favorito: string;
  nome: string;
  tipo_skill_id: number;
}

export interface AvaliadorCertificacaoDto {
  id: number;
  avaliador_id: number;
  certificacao_id: number;
  certificado: string;
  certificado_file: string;
}

export interface AvaliadorDto {
  id: number;
  usuario_id: number;
  perfil_id: number;
  empresa_id: number | null;
  telefone: string;
  localizacao: string | null;
  apresentacao: string;
  avaliar_todos: boolean;
  logo?: string;
  meio_notificacao: string;
  status_cadastro: number;
  ativo: boolean;
  skills: AvaliadorSkillDto[];
  certificacoes: AvaliadorCertificacaoDto[];
  usuario: UsuarioDto;
}
/* 
export interface EmpresaDto {
  id: number;
  nome_empresa: string;
}

export interface AvaliadorCreateInput {
  usuario_id: number;
  perfil_id: number;
  empresa_id: number | null;
  telefone: string;
  localizacao: string;
  apresentacao: string;
  avaliar_todos: boolean;
  logo?: string;
  meio_notificacao: string;
  status_cadastro: number;
  language: string;
}

export interface AvaliadorUpdateInput {
  avaliador_id: number;
  usuario_id: number;
  perfil_id: number;
  empresa_id: number | null;
  telefone: string;
  localizacao: string;
  apresentacao: string;
  avaliar_todos: boolean;
  logo?: string;
  meio_notificacao: string;
  ativo: boolean;
  language: string;
}

export interface SkillInput {
  avaliador_id: number;
  skill_id: number;
  peso: number;
  favorito: boolean;
  tempo_favorito: string;
}

export interface FormacaoInput {
  avaliador_id: number;
  graduacao_id: number;
  formacao: string;
  certificado_file: string;
}

export interface CertificacaoInput {
  avaliador_id: number;
  certificacao_id: number;
  certificado_file: string;
} */

@Injectable()
export class AvaliadorService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
    private readonly authService: AuthService,
  ) {}

  async getCheckHasPerfil(
    usuarioId: number,
    perfilId: number,
  ): Promise<CheckPerfil> {
    const registro = await this.prisma.usuarioPerfilAvaliador.findUnique({
      where: {
        ativo: true,
        status_cadastro: 1, // -1: aguardando confirmacao / 1: confirmado / 0: rejeitado
        usuario_id_perfil_id: {
          // <-- chave composta
          usuario_id: usuarioId,
          perfil_id: perfilId,
        },
      },
      select: { id: true }, // só pode usar colunas existentes
    });

    const validaPlano = await this.authService.validaPlanoUser(
      usuarioId,
      perfilId,
    );

    return {
      id: registro?.id ?? null,
      usuario_id: usuarioId, // adiciona manualmente
      redirect_to: validaPlano ?? '',
    };
  }

  async getCheckHasPerfilCadastro(
    usuarioId: number,
    perfilId: number,
    nomeUser: string,
  ): Promise<CheckPerfilCadastro> {
    const registro = await this.prisma.usuarioPerfilAvaliador.findUnique({
      where: {
        usuario_id_perfil_id: {
          // <-- chave composta
          usuario_id: usuarioId,
          perfil_id: perfilId,
        },
      },
      select: { id: true }, // só pode usar colunas existentes
    });

    return {
      id: registro?.id ?? null,
      usuario_id: usuarioId, // adiciona manualmente
      nome_user: nomeUser,
    };
  }

  async getAvaliador(
    id: number,
    usuarioId: number,
    perfilId: number,
    lang: string,
  ): Promise<AvaliadorDto> {
    const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirstOrThrow(
      {
        where: { id, usuario_id: usuarioId, perfil_id: perfilId },
        include: {
          formacao: {
            include: {
              graduacao: { select: { graduacao: true } },
            },
          },
          certificacoes: {
            include: {
              certificacoes: { select: { certificado: true } },
            },
          },
          skills: {
            include: {
              skill: { select: { skill: true, tipo_skill_id: true } },
            },
          },
          usuario: {
            select: {
              primeiro_nome: true,
              ultimo_nome: true,
              nome_social: true,
              data_nascimento: true,
              genero_id: true,
              genero: {
                select: {
                  genero: true,
                },
              },
              cidade_id: true,
              cidade: {
                select: {
                  estado_id: true,
                  cidade: true,
                  estado: {
                    select: {
                      estado: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    );

    const usr = avaliador.usuario;

    // 🔥 Corrigindo o problema do timezone
    let dataFormatada: string | null = null;

    if (usr.data_nascimento) {
      const iso = usr.data_nascimento.toISOString().substring(0, 10); // YYYY-MM-DD

      const [year, month, day] = iso.split('-').map(Number);

      const date = new Date(year, month - 1, day); // ← sem UTC

      dataFormatada = new Intl.DateTimeFormat(lang ?? 'pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    }

    const usuario: UsuarioDto = {
      primeiro_nome: usr.primeiro_nome,
      ultimo_nome: usr.ultimo_nome,
      nome_social: usr.nome_social ?? '',
      data_nascimento: dataFormatada, // agora correto
      genero_id: usr.genero_id,
      genero: usr.genero.genero,
      cidade_id: usr.cidade_id,
      cidade: usr.cidade.cidade,
      estado_id: usr.cidade?.estado_id ?? null,
      estado: usr.cidade.estado.estado,
    };

    // 🔹 Achatar as certificacoes
    const certificacoes: AvaliadorCertificacaoDto[] =
      avaliador.certificacoes.map((s) => ({
        id: s.id,
        avaliador_id: s.avaliador_id,
        certificacao_id: s.certificacao_id,
        certificado: s.certificacoes.certificado,
        certificado_file: s.certificado_file,
      }));

    const skills: AvaliadorSkillDto[] = avaliador.skills.map((s) => ({
      id: s.id,
      avaliador_id: s.avaliador_id,
      skill_id: s.skill_id,
      peso: s.peso,
      favorito: s.favorito,
      tempo_favorito: s.tempo_favorito,
      nome: s.skill.skill, // pega direto o texto da skill
      tipo_skill_id: s.skill.tipo_skill_id,
    }));

    return {
      ...avaliador,
      skills,
      certificacoes,
      usuario,
    };
  }

  async getAvaliadores(recrutador_id: number) {
    const avaliadores = await this.prisma.usuarioPerfilAvaliador.findMany({
      where: {
        empresa: {
          recrutador_id: recrutador_id, // <-- filtro via relação
        },
      },
      select: {
        id: true,
        localizacao: true,
        logo: true,
        status_cadastro: true,
        ativo: true,
        empresa: {
          select: {
            id: true,
            nome_empresa: true,
          },
        },
        usuario: {
          select: {
            primeiro_nome: true,
            ultimo_nome: true,
          },
        },
      },
    });

    return avaliadores.map((a) => ({
      id: a.id,
      localizacao: a.localizacao,
      logo: a.logo,
      status_cadastro: a.status_cadastro,
      ativo: a.ativo,
      empresa_id: a.empresa?.id,
      nome_empresa: a.empresa?.nome_empresa ?? '',
      nomeUser:
        `${a.usuario?.primeiro_nome ?? ''} ${a.usuario?.ultimo_nome ?? ''}`.trim(),
    }));
  }

  async createAvaliador(data: {
    usuario_id: number;
    perfil_id: number;
    empresa_id: number | null;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    avaliar_todos: boolean;
    logo?: string;
    meio_notificacao: string;
    status_cadastro: number;
    language: string;
  }) {
    const createData: Prisma.UsuarioPerfilAvaliadorCreateInput = {
      usuario: {
        connect: { id: data.usuario_id },
      },
      perfil: {
        connect: { id: data.perfil_id },
      },
      empresa: data.empresa_id
        ? { connect: { id: data.empresa_id } }
        : undefined,
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      avaliar_todos: data.avaliar_todos,
      logo: data.logo ?? '',
      meio_notificacao: data.meio_notificacao,
      status_cadastro: data.status_cadastro, // -1: aguardando confirmacao / 1: confirmado / 0: rejeitado
      linguagem: data.language,
    };

    const avaliador = await this.prisma.usuarioPerfilAvaliador.create({
      data: createData,
    });

    if (data.empresa_id) {
      const token = generateActivationToken72(avaliador.id, data.empresa_id);

      const activationLink = `${process.env.SITE_URL}/cadastro/confirmar-avaliador?token=${token}&pf=${data.perfil_id}&lng=${data.language}`; //`https://meusite.com/confirmar-email?token=${token}`;
      const rejectLink = `${process.env.SITE_URL}/cadastro/rejeitar-avaliador?token=${token}&pf=${data.perfil_id}&lng=${data.language}`;

      //busco o email da empresa
      const empresa = await this.prisma.empresa.findFirst({
        where: {
          id: data.empresa_id,
        },
        select: {
          id: true,
          nome_empresa: true,
          email: true,
        },
      });

      //busco o nome do usuario
      const user = await this.prisma.usuario.findFirst({
        where: {
          id: data.usuario_id,
        },
        select: {
          id: true,
          primeiro_nome: true,
          ultimo_nome: true,
        },
      });

      if (!empresa) {
        throw new Error('Empresa não encontrada');
      }

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      await this.mailService.sendRequestRegisterAvaliador(
        empresa.email,
        `${user.primeiro_nome} ${user.ultimo_nome}`,
        empresa?.nome_empresa,
        activationLink,
        rejectLink,
        data.language,
      );
    }

    return {
      id: avaliador.id,
    };
  }

  async updateAvaliador(data: {
    avaliador_id: number;
    usuario_id: number;
    perfil_id: number;
    empresa_id: number | null;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    avaliar_todos: boolean;
    logo?: string;
    meio_notificacao: string;
    ativo: boolean;
    language: string;
  }) {
    let statusCadastro = 1;
    let atualizarDataEnvioLink = false;

    if (data.empresa_id) {
      //busca e valida a empresa atual no cadastro
      const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
        where: {
          id: data.avaliador_id,
        },
        select: {
          empresa_id: true,
          status_cadastro: true,
        },
      });

      if (avaliador?.empresa_id !== data.empresa_id) {
        statusCadastro = -1;
        atualizarDataEnvioLink = true;

        const token = generateActivationToken72(
          data.avaliador_id,
          data.empresa_id,
        );

        const activationLink = `${process.env.SITE_URL}/cadastro/confirmar-avaliador?token=${token}&pf=${data.perfil_id}&lng=${data.language}`; //`https://meusite.com/confirmar-email?token=${token}`;
        const rejectLink = `${process.env.SITE_URL}/cadastro/rejeitar-avaliador?token=${token}&pf=${data.perfil_id}&lng=${data.language}`;

        //busco o email da empresa
        const empresa = await this.prisma.empresa.findFirst({
          where: {
            id: data.empresa_id,
          },
          select: {
            id: true,
            nome_empresa: true,
            email: true,
          },
        });

        //busco o nome do usuario
        const user = await this.prisma.usuario.findFirst({
          where: {
            id: data.usuario_id,
          },
          select: {
            id: true,
            primeiro_nome: true,
            ultimo_nome: true,
          },
        });

        if (!empresa) {
          throw new Error('Empresa não encontrada');
        }

        if (!user) {
          throw new Error('Usuário não encontrado');
        }

        await this.mailService.sendRequestRegisterAvaliador(
          empresa.email,
          `${user.primeiro_nome} ${user.ultimo_nome}`,
          empresa?.nome_empresa,
          activationLink,
          rejectLink,
          data.language,
        );
      } else {
        statusCadastro = avaliador.status_cadastro;
      }
    }

    const updateData: Prisma.UsuarioPerfilAvaliadorUpdateInput = {
      empresa: data.empresa_id
        ? { connect: { id: data.empresa_id } }
        : { disconnect: true },
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      avaliar_todos: data.avaliar_todos,
      logo: data.logo ?? '',
      meio_notificacao: data.meio_notificacao,
      ativo: data.ativo,
      status_cadastro: statusCadastro,
    };

    if (atualizarDataEnvioLink) {
      updateData.data_envio_link = new Date();
    }

    return this.prisma.usuarioPerfilAvaliador.update({
      where: { id: data.avaliador_id },
      data: updateData,
    });
  }

  async getEmpresasCadastro(lang: string): Promise<{
    empresas: { id: number; nome_empresa: string }[];
  }> {
    const empresas = await this.prisma.empresa.findMany({
      where: { linguagem: lang },
      select: {
        id: true,
        nome_empresa: true,
      },
      orderBy: {
        nome_empresa: 'asc',
      },
    });

    return { empresas };
  }

  async createAvaliadorSkills(skills: Prisma.AvaliadorSkillCreateManyInput[]) {
    return this.prisma.avaliadorSkill.createMany({
      data: skills,
    });
  }

  async updateAvaliadorSkills(
    avaliador_id: number,
    skills: {
      avaliador_id: number;
      skill_id: number;
      peso: number;
      favorito: boolean;
      tempo_favorito: string;
    }[],
  ) {
    // Busca skills atuais do avaliador
    const existentes = await this.prisma.avaliadorSkill.findMany({
      where: { avaliador_id },
    });

    const idsExistentes = existentes.map((s) => s.skill_id);
    const idsNovos = skills.map((s) => s.skill_id);

    // 🔹 Remove apenas as skills que não estão mais no novo array
    const paraRemover = idsExistentes.filter((id) => !idsNovos.includes(id));
    if (paraRemover.length > 0) {
      await this.prisma.avaliadorSkill.deleteMany({
        where: { avaliador_id, skill_id: { in: paraRemover } },
      });
    }

    // 🔹 Atualiza ou cria
    for (const s of skills) {
      const existente = existentes.find((e) => e.skill_id === s.skill_id);
      if (existente) {
        // Atualiza apenas se houve mudança real
        const precisaAtualizar =
          existente.peso !== s.peso ||
          existente.favorito !== s.favorito ||
          existente.tempo_favorito !== s.tempo_favorito;

        if (precisaAtualizar) {
          await this.prisma.avaliadorSkill.updateMany({
            where: { avaliador_id, skill_id: s.skill_id },
            data: {
              peso: s.peso,
              favorito: s.favorito,
              tempo_favorito: s.tempo_favorito,
            },
          });
        }
      } else {
        // Cria nova
        await this.prisma.avaliadorSkill.create({ data: s });
      }
    }
  }

  async createAvaliadorFormacao(
    formacoes: Prisma.AvaliadorFormacaoAcademicaCreateManyInput[],
  ) {
    return this.prisma.avaliadorFormacaoAcademica.createMany({
      data: formacoes,
    });
  }

  async updateAvaliadorFormacao(
    avaliador_id: number,
    formacoes: {
      avaliador_id: number;
      graduacao_id: number;
      formacao: string;
      certificado_file: string;
    }[],
  ) {
    // Busca formacoes atuais no banco
    const existentes = await this.prisma.avaliadorFormacaoAcademica.findMany({
      where: { avaliador_id },
    });

    // IDs atuais e novos
    const idsExistentes = existentes.map((f) => f.graduacao_id);
    const idsNovos = formacoes.map((f) => f.graduacao_id);

    // Remove apenas as formações que não estão mais no novo array
    const paraRemover = idsExistentes.filter((id) => !idsNovos.includes(id));
    if (paraRemover.length > 0) {
      await this.prisma.avaliadorFormacaoAcademica.deleteMany({
        where: { avaliador_id, graduacao_id: { in: paraRemover } },
      });
    }

    // Atualiza ou cria
    for (const f of formacoes) {
      const existente = existentes.find(
        (e) => e.graduacao_id === f.graduacao_id,
      );
      if (existente) {
        await this.prisma.avaliadorFormacaoAcademica.updateMany({
          where: { avaliador_id, graduacao_id: f.graduacao_id },
          data: {
            formacao: f.formacao,
            certificado_file: f.certificado_file || existente.certificado_file,
          },
        });
      } else {
        await this.prisma.avaliadorFormacaoAcademica.create({
          data: f,
        });
      }
    }
  }

  async createAvaliadorCertificacoes(
    certificacoes: Prisma.AvaliadorCertificacoesCreateManyInput[],
  ) {
    return this.prisma.avaliadorCertificacoes.createMany({
      data: certificacoes,
    });
  }

  async updateAvaliadorCertificacoes(
    avaliador_id: number,
    certificacoes: {
      avaliador_id: number;
      certificacao_id: number;
      certificado_file: string;
    }[],
  ) {
    // Busca certificações atuais no banco
    const existentes = await this.prisma.avaliadorCertificacoes.findMany({
      where: { avaliador_id },
    });

    const idsExistentes = existentes.map((c) => c.certificacao_id);
    const idsNovos = certificacoes.map((c) => c.certificacao_id);

    // Remove apenas as que sumiram
    const paraRemover = idsExistentes.filter((id) => !idsNovos.includes(id));
    if (paraRemover.length > 0) {
      await this.prisma.avaliadorCertificacoes.deleteMany({
        where: { avaliador_id, certificacao_id: { in: paraRemover } },
      });
    }

    // Atualiza ou cria
    for (const c of certificacoes) {
      const existente = existentes.find(
        (e) => e.certificacao_id === c.certificacao_id,
      );
      if (existente) {
        await this.prisma.avaliadorCertificacoes.updateMany({
          where: { avaliador_id, certificacao_id: c.certificacao_id },
          data: {
            certificado_file: c.certificado_file || existente.certificado_file,
          },
        });
      } else {
        await this.prisma.avaliadorCertificacoes.create({
          data: c,
        });
      }
    }
  }

  async resendLink(id: number, usuarioId: number, language: string) {
    const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
      where: {
        id: id,
        usuario_id: usuarioId,
      },
      select: {
        empresa_id: true, // 👈 só esse campo do avaliador
        perfil_id: true,
        empresa: {
          select: {
            nome_empresa: true,
            email: true, // 👈 e aqui só o email da empresa
          },
        },
      },
    });

    const token = generateActivationToken72(id, avaliador?.empresa_id ?? 0);

    const activationLink = `${process.env.SITE_URL}/cadastro/confirmar-avaliador?token=${token}&pf=${avaliador?.perfil_id}&lng=${language}`; //`https://meusite.com/confirmar-email?token=${token}`;
    const rejectLink = `${process.env.SITE_URL}/cadastro/rejeitar-avaliador?token=${token}&pf=${avaliador?.perfil_id}&lng=${language}`;

    //busco o nome do usuario
    const user = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
      },
      select: {
        primeiro_nome: true,
        ultimo_nome: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    await this.mailService.sendRequestRegisterAvaliador(
      avaliador?.empresa?.email ?? '',
      `${user.primeiro_nome} ${user.ultimo_nome}`,
      avaliador?.empresa?.nome_empresa ?? '',
      activationLink,
      rejectLink,
      language,
    );

    await this.prisma.usuarioPerfilAvaliador.update({
      where: {
        id: id,
      },
      data: {
        data_envio_link: new Date(),
      },
    });
  }

  async activateUserByToken(token: string, language: string, perfilId: number) {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_ACTIVATE_SECRET!,
      ) as JwtPayload;

      const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
        where: {
          id: payload.userId,
          perfil_id: perfilId,
          empresa_id: payload.empresaId,
        },
        select: {
          id: true, // 👈 só esse campo do avaliador
          status_cadastro: true,
          usuario_id: true,
          empresa: {
            select: {
              nome_empresa: true,
            },
          },
          usuario: {
            select: {
              email: true,
              primeiro_nome: true,
              ultimo_nome: true,
            },
          },
        },
      });

      if (!avaliador) {
        const messageRetorno = this.i18n.translate(
          'common.auth.usuario_nao_encotrado',
          { lang: language },
        );
        throw new Error(messageRetorno);
      }

      if (avaliador.status_cadastro === 1) return avaliador;

      const avalaidorRet = await this.prisma.usuarioPerfilAvaliador.update({
        where: { id: avaliador.id },
        data: { status_cadastro: 1 },
      });

      await this.mailService.sendWelcomeAvaliador(
        avaliador?.usuario.email ?? '',
        `${avaliador?.usuario.primeiro_nome} ${avaliador?.usuario.ultimo_nome}`,
        avaliador?.empresa?.nome_empresa ?? '',
        language,
      );

      return avalaidorRet;
    } catch (err) {
      let messageRetorno = '';

      if (err instanceof jwt.TokenExpiredError) {
        messageRetorno = this.i18n.translate('common.auth.token_expirado', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      } else {
        messageRetorno = this.i18n.translate('common.auth.token_invalido', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      }
    }
  }

  async rejectUserByToken(token: string, language: string, perfilId: number) {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_ACTIVATE_SECRET!,
      ) as JwtPayload;

      // console.log(payload);

      const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
        where: {
          id: payload.userId,
          perfil_id: perfilId,
          empresa_id: payload.empresaId,
          status_cadastro: {
            not: 1,
          },
        },
        select: {
          id: true, // 👈 só esse campo do avaliador
          status_cadastro: true,
          usuario_id: true,
          empresa: {
            select: {
              nome_empresa: true,
            },
          },
          usuario: {
            select: {
              email: true,
              primeiro_nome: true,
              ultimo_nome: true,
            },
          },
        },
      });

      if (!avaliador) {
        const messageRetorno = this.i18n.translate(
          'common.auth.usuario_nao_encotrado',
          { lang: language },
        );
        throw new Error(messageRetorno);
      }

      if (avaliador.status_cadastro === 0) return avaliador;

      const avalaidorRet = await this.prisma.usuarioPerfilAvaliador.update({
        where: { id: avaliador.id },
        data: { status_cadastro: 0 },
      });

      await this.mailService.sendRejectAvaliador(
        avaliador?.usuario.email ?? '',
        `${avaliador?.usuario.primeiro_nome} ${avaliador?.usuario.ultimo_nome}`,
        avaliador?.empresa?.nome_empresa ?? '',
        language,
      );

      return avalaidorRet;
    } catch (err) {
      let messageRetorno = '';

      if (err instanceof jwt.TokenExpiredError) {
        messageRetorno = this.i18n.translate('common.auth.token_expirado', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      } else {
        messageRetorno = this.i18n.translate('common.auth.token_invalido', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      }
    }
  }

  async activateUserByForm(id: number, empresa_id: number, language: string) {
    try {
      const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
        where: {
          id: id,
          empresa_id: empresa_id,
        },
        select: {
          id: true, // 👈 só esse campo do avaliador
          status_cadastro: true,
          usuario_id: true,
          empresa: {
            select: {
              nome_empresa: true,
            },
          },
          usuario: {
            select: {
              email: true,
              primeiro_nome: true,
              ultimo_nome: true,
            },
          },
        },
      });

      if (!avaliador) {
        const messageRetorno = this.i18n.translate(
          'common.auth.usuario_nao_encotrado',
          { lang: language },
        );
        throw new Error(messageRetorno);
      }

      if (avaliador.status_cadastro === 1) return avaliador;

      const avalaidorRet = await this.prisma.usuarioPerfilAvaliador.update({
        where: { id: avaliador.id },
        data: { status_cadastro: 1 },
      });

      await this.mailService.sendWelcomeAvaliador(
        avaliador?.usuario.email ?? '',
        `${avaliador?.usuario.primeiro_nome} ${avaliador?.usuario.ultimo_nome}`,
        avaliador?.empresa?.nome_empresa ?? '',
        language,
      );

      return avalaidorRet;
    } catch (err) {
      let messageRetorno = '';

      if (err instanceof jwt.TokenExpiredError) {
        messageRetorno = this.i18n.translate('common.auth.token_expirado', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      } else {
        messageRetorno = this.i18n.translate('common.auth.token_invalido', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      }
    }
  }

  async rejectUserByForm(id: number, empresa_id: number, language: string) {
    try {
      const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
        where: {
          id: id,
          empresa_id: empresa_id,
        },
        select: {
          id: true, // 👈 só esse campo do avaliador
          status_cadastro: true,
          usuario_id: true,
          empresa: {
            select: {
              nome_empresa: true,
            },
          },
          usuario: {
            select: {
              email: true,
              primeiro_nome: true,
              ultimo_nome: true,
            },
          },
        },
      });

      if (!avaliador) {
        const messageRetorno = this.i18n.translate(
          'common.auth.usuario_nao_encotrado',
          { lang: language },
        );
        throw new Error(messageRetorno);
      }

      if (avaliador.status_cadastro === 0) return avaliador;

      const avalaidorRet = await this.prisma.usuarioPerfilAvaliador.update({
        where: { id: avaliador.id },
        data: { status_cadastro: 0 },
      });

      await this.mailService.sendRejectAvaliador(
        avaliador?.usuario.email ?? '',
        `${avaliador?.usuario.primeiro_nome} ${avaliador?.usuario.ultimo_nome}`,
        avaliador?.empresa?.nome_empresa ?? '',
        language,
      );

      return avalaidorRet;
    } catch (err) {
      let messageRetorno = '';

      if (err instanceof jwt.TokenExpiredError) {
        messageRetorno = this.i18n.translate('common.auth.token_expirado', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      } else {
        messageRetorno = this.i18n.translate('common.auth.token_invalido', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      }
    }
  }

  async getUser(usuarioId: number, lang: string) {
    const usr = await this.prisma.usuario.findFirstOrThrow({
      where: { id: usuarioId, linguagem: lang },

      select: {
        primeiro_nome: true,
        ultimo_nome: true,
        nome_social: true,
        data_nascimento: true,
        genero_id: true,
        genero: {
          select: {
            genero: true,
          },
        },
        cidade_id: true,
        cidade: {
          select: {
            estado_id: true,
            cidade: true,
            estado: {
              select: {
                estado: true,
              },
            },
          },
        },
      },
    });

    // 🔥 Corrigindo o problema do timezone
    let dataFormatada: string | null = null;

    if (usr.data_nascimento) {
      const iso = usr.data_nascimento.toISOString().substring(0, 10); // YYYY-MM-DD

      const [year, month, day] = iso.split('-').map(Number);

      const date = new Date(year, month - 1, day); // ← sem UTC

      dataFormatada = new Intl.DateTimeFormat(lang ?? 'pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    }

    return {
      primeiro_nome: usr.primeiro_nome,
      ultimo_nome: usr.ultimo_nome,
      nome_social: usr.nome_social ?? '',
      data_nascimento: dataFormatada, // agora correto
      genero_id: usr.genero_id,
      genero: usr.genero.genero,
      cidade_id: usr.cidade_id,
      cidade: usr.cidade.cidade,
      estado_id: usr.cidade?.estado_id ?? null,
      estado: usr.cidade.estado.estado,
    };
  }
}
