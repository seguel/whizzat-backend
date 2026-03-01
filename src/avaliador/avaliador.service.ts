import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, PerfilTipo } from '@prisma/client';
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

@Injectable()
export class AvaliadorService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
    private readonly authService: AuthService,
  ) {}

  private getNomeExibicao(usuario: {
    nome_social?: string | null;
    primeiro_nome: string;
    ultimo_nome: string;
  }) {
    if (usuario.nome_social?.trim()) {
      return usuario.nome_social;
    }

    return `${usuario.primeiro_nome} ${usuario.ultimo_nome}`.trim();
  }

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
      pontos: 0,
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

      await this.prisma.notificacao.create({
        data: {
          usuario_id: avaliador?.usuario_id,
          perfil_tipo: 'AVALIADOR',
          perfil_id: 3,
          tipo: 'CADASTRO_AVALIADOR',
          referencia_id: null,
          titulo: 'Cadastro Efetivado!',
          mensagem: `Seu cadastro junto a ${avaliador?.empresa?.nome_empresa ?? ''}, foi APROVADO!`,
        },
      });

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

      await this.prisma.notificacao.create({
        data: {
          usuario_id: avaliador?.usuario_id,
          perfil_tipo: 'AVALIADOR',
          perfil_id: 3,
          tipo: 'CADASTRO_AVALIADOR',
          referencia_id: null,
          titulo: 'Cadastro Rejeitado!',
          mensagem: `Seu cadastro junto a ${avaliador?.empresa?.nome_empresa ?? ''}, foi REJEITADO!`,
        },
      });

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

  async getNotificacoesCount(usuarioId: number) {
    return this.prisma.notificacao.count({
      where: {
        usuario_id: usuarioId,
        perfil_tipo: 'AVALIADOR', // usar enum se estiver tipado
        lida: false,
      },
    });
  }

  async getNotificacoes(
    usuarioId: number,
    page: number,
    apenasNaoLidas?: boolean,
  ) {
    const take = 20;
    const skip = (page - 1) * take;

    const where: Prisma.NotificacaoWhereInput = {
      usuario_id: usuarioId,
      perfil_tipo: PerfilTipo.AVALIADOR,
      ...(apenasNaoLidas ? { lida: false } : {}),
    };

    const notificacoes = await this.prisma.notificacao.findMany({
      where,
      orderBy: [{ lida: 'asc' }, { criado_em: 'desc' }],
      skip,
      take,
    });

    // 🔥 1️⃣ Pegar todos referencia_id válidos
    const referenciaIds = notificacoes
      .filter((n) => n.referencia_id)
      .map((n) => n.referencia_id as number);

    // 🔥 2️⃣ Buscar todos rankings de uma vez
    const rankings = await this.prisma.avaliadorRankingAvaliacao.findMany({
      where: {
        id: { in: referenciaIds },
      },
      include: {
        candidatoSkill: {
          include: {
            candidatoSkill: {
              include: {
                skill: true,
                candidato: {
                  include: {
                    usuario: {
                      select: {
                        nome_social: true,
                        primeiro_nome: true,
                        ultimo_nome: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 🔥 3️⃣ Criar Map para lookup rápido
    const rankingMap = new Map(rankings.map((r) => [r.id, r]));

    // 🔥 4️⃣ Montar resposta final
    const notificacoesComContexto = notificacoes.map((n) => {
      let skillNome: string | null = null;
      let nomeExibicao: string | null = null;

      if (n.referencia_id) {
        const ranking = rankingMap.get(n.referencia_id);

        const usuario =
          ranking?.candidatoSkill?.candidatoSkill?.candidato?.usuario;

        if (usuario) {
          nomeExibicao = this.getNomeExibicao(usuario);
        }

        skillNome =
          ranking?.candidatoSkill?.candidatoSkill?.skill?.skill ?? null;
      }

      return {
        id: n.id,
        titulo: n.titulo,
        mensagem: n.mensagem,
        lida: n.lida,
        criado_em: n.criado_em,
        tipo: n.tipo,
        referencia_id: n.referencia_id,
        contexto: {
          skill: skillNome,
          nome: nomeExibicao,
        },
      };
    });

    return notificacoesComContexto;
  }

  async marcarComoLida(id: number, usuarioId: number) {
    return this.prisma.notificacao.updateMany({
      where: {
        id,
        usuario_id: usuarioId, // segurança
        perfil_tipo: PerfilTipo.AVALIADOR,
      },
      data: {
        lida: true,
      },
    });
  }

  async marcarTodasComoLidas(usuarioId: number) {
    return this.prisma.notificacao.updateMany({
      where: {
        usuario_id: usuarioId,
        perfil_tipo: PerfilTipo.AVALIADOR,
        lida: false,
      },
      data: {
        lida: true,
      },
    });
  }

  async deletarNotificacao(id: number, usuarioId: number) {
    return this.prisma.notificacao.deleteMany({
      where: {
        id,
        usuario_id: usuarioId,
        perfil_tipo: PerfilTipo.AVALIADOR,
      },
    });
  }

  private static conviteInclude =
    Prisma.validator<Prisma.AvaliadorRankingAvaliacaoInclude>()({
      candidatoSkill: {
        include: {
          candidatoSkill: {
            include: {
              skill: true,
              candidato: {
                include: {
                  usuario: {
                    select: {
                      nome_social: true,
                      primeiro_nome: true,
                      ultimo_nome: true,
                      cidade: {
                        select: {
                          cidade: true,
                          estado: {
                            select: {
                              sigla: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

  private typeConvite!: Prisma.AvaliadorRankingAvaliacaoGetPayload<{
    include: typeof AvaliadorService.conviteInclude;
  }>;

  async listarConvites(usuarioId: number) {
    const agora = new Date();

    // 1️⃣ Buscar o perfil avaliador pelo usuario_id
    const perfilAvaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!perfilAvaliador) {
      return {
        pendentes: [],
        aceitos: [],
        agendados: [],
      };
    }

    // 2️⃣ Buscar convites usando o ID correto da tabela UsuarioPerfilAvaliador
    const convites = await this.prisma.avaliadorRankingAvaliacao.findMany({
      where: {
        avaliador_id: perfilAvaliador.id, // 👈 agora correto
      },
      include: AvaliadorService.conviteInclude,
      orderBy: {
        data_convite: 'desc',
      },
    });

    const pendentes = convites.filter(
      (c) => c.aceite === null && c.data_expiracao > agora,
    );

    const aceitos = convites.filter((c) => c.aceite === true);

    const agendados: typeof convites = [];

    return {
      pendentes: pendentes.map((c) => this.mapConvite(c)),
      aceitos: aceitos.map((c) => this.mapConvite(c)),
      agendados,
    };
  }

  async aceitarConvite(id: number, usuarioId: number) {
    return await this.prisma.$transaction(async (tx) => {
      // 1️⃣ Buscar perfil do avaliador
      const perfilAvaliador = await tx.usuarioPerfilAvaliador.findFirst({
        where: {
          usuario_id: usuarioId,
          ativo: true,
        },
        select: { id: true },
      });

      if (!perfilAvaliador) {
        throw new NotFoundException('Perfil de avaliador não encontrado');
      }

      // 2️⃣ Buscar convite
      const convite = await tx.avaliadorRankingAvaliacao.findFirst({
        where: {
          id,
          avaliador_id: perfilAvaliador.id,
        },
      });

      if (!convite) {
        throw new NotFoundException('Convite não encontrado');
      }

      if (convite.data_expiracao < new Date()) {
        throw new BadRequestException('Convite expirado');
      }

      // 🔒 3️⃣ UPDATE SEGURO (ANTI-RACE CONDITION)
      const updateResult = await tx.avaliadorRankingAvaliacao.updateMany({
        where: {
          id,
          avaliador_id: perfilAvaliador.id,
          aceite: null, // garante que ainda não foi processado
          data_aceite_recusa: null,
        },
        data: {
          aceite: true,
          data_aceite_recusa: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(
          'Convite já foi aceito ou processado por outro avaliador',
        );
      }

      // 🔥 4️⃣ Cancelar outros convites concorrentes
      const outrosConvites = await tx.avaliadorRankingAvaliacao.findMany({
        where: {
          avaliacao_skill_id: convite.avaliacao_skill_id,
          avaliador_id: { not: convite.avaliador_id },
          aceite: null,
          data_aceite_recusa: null,
        },
        select: {
          id: true,
          avaliador: {
            select: {
              usuario_id: true,
            },
          },
        },
      });

      if (outrosConvites.length > 0) {
        const outrosIds = outrosConvites.map((c) => c.id);
        const outrosUsuariosIds = outrosConvites.map(
          (c) => c.avaliador.usuario_id,
        );

        // 🔥 4.1️⃣ Excluir notificações dos outros avaliadores
        await tx.notificacao.deleteMany({
          where: {
            referencia_id: { in: outrosIds },
            usuario_id: { in: outrosUsuariosIds },
          },
        });

        // 🔥 4.2️⃣ Excluir convites pendentes
        await tx.avaliadorRankingAvaliacao.deleteMany({
          where: {
            id: { in: outrosIds },
          },
        });
      }

      // 5️⃣ Criar vínculo avaliador x skill (evita duplicado)
      await tx.avaliadorAvaliacaoSkill.createMany({
        data: [
          {
            avaliador_id: perfilAvaliador.id,
            avaliacao_skill_id: convite.avaliacao_skill_id,
          },
        ],
        skipDuplicates: true,
      });

      // 6️⃣ Atualizar candidatoAvaliacaoSkill (proteção extra)
      const candidatoUpdate = await tx.candidatoAvaliacaoSkill.updateMany({
        where: {
          id: convite.avaliacao_skill_id,
          avaliador_id: null,
        },
        data: {
          avaliador_id: perfilAvaliador.id,
        },
      });

      if (candidatoUpdate.count === 0) {
        throw new BadRequestException('Skill já vinculada a outro avaliador');
      }

      // 7️⃣ Marcar notificação como lida
      await tx.notificacao.updateMany({
        where: {
          referencia_id: id,
          usuario_id: usuarioId,
        },
        data: {
          lida: true,
        },
      });

      return { success: true };
    });
  }

  async recusarConvite(id: number, usuarioId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const perfilAvaliador = await tx.usuarioPerfilAvaliador.findFirst({
        where: {
          usuario_id: usuarioId,
          ativo: true,
        },
        select: { id: true },
      });

      if (!perfilAvaliador) {
        throw new NotFoundException('Perfil de avaliador não encontrado');
      }

      const convite = await tx.avaliadorRankingAvaliacao.findFirst({
        where: {
          id,
          avaliador_id: perfilAvaliador.id,
        },
      });

      if (!convite) {
        throw new NotFoundException('Convite não encontrado');
      }

      if (convite.aceite !== null) {
        throw new BadRequestException('Convite já processado');
      }

      await tx.avaliadorRankingAvaliacao.update({
        where: { id },
        data: {
          aceite: false,
          data_aceite_recusa: new Date(),
        },
      });

      // ✅ Marcar notificação como lida
      await tx.notificacao.updateMany({
        where: {
          referencia_id: id,
          usuario_id: usuarioId,
        },
        data: {
          lida: true,
        },
      });

      return { success: true };
    });
  }

  private mapConvite = (
    convite: Prisma.AvaliadorRankingAvaliacaoGetPayload<{
      include: typeof AvaliadorService.conviteInclude;
    }>,
  ) => {
    const usuario = convite.candidatoSkill.candidatoSkill.candidato.usuario;

    const skill = convite.candidatoSkill.candidatoSkill.skill;

    const nome = this.getNomeExibicao(usuario);

    const cidade = usuario.cidade?.cidade;
    const sigla = usuario.cidade?.estado?.sigla;

    return {
      id: convite.id,
      candidato_nome: nome,
      localizacao: cidade && sigla ? `${cidade}/${sigla}` : null,
      logo: convite.candidatoSkill.candidatoSkill.candidato.logo ?? null,
      skill: skill.skill,
      criado_em: convite.data_convite,
      status:
        convite.aceite === null
          ? 'PENDENTE'
          : convite.aceite === true
            ? 'ACEITO'
            : 'RECUSADO',
    };
  };

  private static avaliacaoInclude =
    Prisma.validator<Prisma.AvaliadorAvaliacaoSkillInclude>()({
      candidatoSkill: {
        include: {
          candidatoSkill: {
            include: {
              skill: true,
              candidato: {
                include: {
                  usuario: {
                    select: {
                      nome_social: true,
                      primeiro_nome: true,
                      ultimo_nome: true,
                      cidade: {
                        select: {
                          cidade: true,
                          estado: {
                            select: {
                              sigla: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

  async listarAvaliacoesDoAvaliador(usuarioId: number) {
    // 1️⃣ Buscar perfil do avaliador
    const perfilAvaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: { id: true },
    });

    if (!perfilAvaliador) {
      return {
        aguardando_agendamento: [],
        agendadas: [],
      };
    }

    // 2️⃣ Buscar avaliações vinculadas
    const avaliacoes = await this.prisma.avaliadorAvaliacaoSkill.findMany({
      where: {
        avaliador_id: perfilAvaliador.id,
      },
      include: AvaliadorService.avaliacaoInclude,
      orderBy: {
        data_aceite: 'desc',
      },
    });

    // 3️⃣ Separar colunas
    const aguardando_agendamento = avaliacoes.filter((a) => !a.data_avaliacao);

    const agendadas = avaliacoes.filter((a) => a.data_avaliacao);

    return {
      aguardando_agendamento: aguardando_agendamento.map((a) =>
        this.mapAvaliacao(a),
      ),
      agendadas: agendadas.map((a) => this.mapAvaliacao(a)),
    };
  }

  private mapAvaliacao = (
    avaliacao: Prisma.AvaliadorAvaliacaoSkillGetPayload<{
      include: typeof AvaliadorService.avaliacaoInclude;
    }>,
  ) => {
    const candidato = avaliacao.candidatoSkill.candidatoSkill.candidato;

    const usuario = candidato.usuario;

    const skill = avaliacao.candidatoSkill.candidatoSkill.skill;

    const peso = avaliacao.candidatoSkill.candidatoSkill.peso;

    const nome = this.getNomeExibicao(usuario);

    const cidade = usuario.cidade?.cidade;
    const sigla = usuario.cidade?.estado?.sigla;

    return {
      id: avaliacao.id,
      candidato_nome: nome,
      localizacao: cidade && sigla ? `${cidade}/${sigla}` : null,
      logo: candidato.logo ?? null,
      skill: skill.skill,
      peso,
      criado_em: avaliacao.data_aceite,
      data_agenda: avaliacao.candidatoSkill.data_avaliacao ?? null,
    };
  };
}
