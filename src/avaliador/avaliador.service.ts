import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { generateActivationToken72 } from '../lib/util';
import { I18nService } from 'nestjs-i18n';
import { MailService } from '../mail/mail.service';
// import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  empresaId: number;
}

@Injectable()
export class AvaliadorService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
  ) {}

  async getCheckHasPerfil(
    usuarioId: number,
    perfilId: number,
  ): Promise<{ id: number | null; usuario_id: number }> {
    const registro = await this.prisma.usuario_perfil_avaliador.findUnique({
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

    return {
      id: registro?.id ?? null,
      usuario_id: usuarioId, // adiciona manualmente
    };
  }

  async getCheckHasPerfilCadastro(
    usuarioId: number,
    perfilId: number,
    nomeUser: string,
  ): Promise<{ id: number | null; usuario_id: number; nome_user: string }> {
    const registro = await this.prisma.usuario_perfil_avaliador.findUnique({
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
    nomeUser: string,
  ) {
    const avaliador = await this.prisma.usuario_perfil_avaliador.findFirst({
      where: { id, usuario_id: usuarioId, perfil_id: perfilId },
      include: {
        skills: {
          include: {
            skill: {
              select: {
                skill: true, // <-- ou o nome real da coluna da tabela skill
              },
            },
          },
        },
      },
    });

    // 🔹 Achatar as skills
    const skills = avaliador?.skills.map((s) => ({
      avaliador_id: s.avaliador_id,
      skill_id: s.skill_id,
      peso: s.peso,
      favorito: s.favorito,
      tempo_favorito: s.tempo_favorito,
      nome: s.skill.skill, // pega direto o texto da skill
    }));

    return {
      ...avaliador,
      nomeUser,
      skills,
    };
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
    const createData: Prisma.usuario_perfil_avaliadorCreateInput = {
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
    };

    const avaliador = await this.prisma.usuario_perfil_avaliador.create({
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
      const avaliador = await this.prisma.usuario_perfil_avaliador.findFirst({
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

    const updateData: Prisma.usuario_perfil_avaliadorUpdateInput = {
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

    return this.prisma.usuario_perfil_avaliador.update({
      where: { id: data.avaliador_id },
      data: updateData,
    });
  }

  async getEmpresasCadastro(): Promise<{
    empresas: { id: number; nome_empresa: string }[];
  }> {
    const empresas = await this.prisma.empresa.findMany({
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

  async createAvaliadorSkills(skills: Prisma.avaliador_skillCreateManyInput[]) {
    return this.prisma.avaliador_skill.createMany({
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
    // Remove todas as skills antigas
    await this.prisma.avaliador_skill.deleteMany({
      where: { avaliador_id },
    });

    // Insere as novas
    if (skills.length > 0) {
      await this.prisma.avaliador_skill.createMany({
        data: skills,
      });
    }
  }

  async resendLink(id: number, usuarioId: number) {
    const avaliador = await this.prisma.usuario_perfil_avaliador.findFirst({
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
    const language = 'pt';

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

    await this.prisma.usuario_perfil_avaliador.update({
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

      const avaliador = await this.prisma.usuario_perfil_avaliador.findFirst({
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

      const avalaidorRet = await this.prisma.usuario_perfil_avaliador.update({
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

      const avaliador = await this.prisma.usuario_perfil_avaliador.findFirst({
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

      const avalaidorRet = await this.prisma.usuario_perfil_avaliador.update({
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
}
