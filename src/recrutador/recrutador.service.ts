import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Empresa } from '@prisma/client';
import { AuthService } from '../auth/auth.service';

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

export interface RecrutadorDto {
  id: number;
  telefone: string;
  localizacao: string | null;
  apresentacao: string;
  logo?: string;
  meio_notificacao: string;
  ativo: boolean;
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
  linguagem: string;
}

@Injectable()
export class RecrutadorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getCheckHasPerfil(
    usuarioId: number,
    perfilId: number,
  ): Promise<CheckPerfil> {
    const registro = await this.prisma.usuarioPerfilRecrutador.findUnique({
      where: {
        ativo: true,
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
    const registro = await this.prisma.usuarioPerfilRecrutador.findUnique({
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

  async hasPerfilInEmpresa(recrutadorId: number): Promise<boolean> {
    const vinculo: Empresa | null = await this.prisma.empresa.findFirst({
      where: {
        recrutador_id: recrutadorId,
      },
    });

    return !!vinculo;
  }

  async createRecrutador(data: {
    usuario_id: number;
    perfil_id: number;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    meio_notificacao: string;
    logo: string;
    language: string;
  }) {
    const createData: Prisma.UsuarioPerfilRecrutadorCreateInput = {
      usuario: {
        connect: { id: data.usuario_id },
      },
      perfil: {
        connect: { id: data.perfil_id },
      },
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      meio_notificacao: data.meio_notificacao,
      logo: data.logo ?? '',
      linguagem: data.language,
    };

    // --- Criação ---
    return this.prisma.usuarioPerfilRecrutador.create({
      data: createData,
    });
  }

  async updateRecrutador(data: {
    id: number;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    meio_notificacao: string;
    logo?: string;
    ativo: boolean;
  }) {
    const updateData: Prisma.UsuarioPerfilRecrutadorUpdateInput = {
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      meio_notificacao: data.meio_notificacao,
      ativo: data.ativo,
    };

    // adiciona só se existir
    if (data.logo) updateData.logo = data.logo;

    return this.prisma.usuarioPerfilRecrutador.update({
      where: {
        id: data.id,
      },
      data: updateData,
    });
  }

  async getRecrutador(
    id: number,
    usuarioId: number,
    perfilId: number,
    lang: string,
  ): Promise<RecrutadorDto | null> {
    const recrutador = await this.prisma.usuarioPerfilRecrutador.findFirst({
      where: {
        id,
        usuario_id: usuarioId,
        perfil_id: perfilId,
      },
      include: {
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
    });

    if (!recrutador) {
      return null;
    }

    const usr = recrutador.usuario;

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
      id: recrutador.id,
      logo: recrutador.logo,
      telefone: recrutador.telefone,
      localizacao: recrutador.localizacao,
      meio_notificacao: recrutador.meio_notificacao,
      ativo: recrutador.ativo,
      apresentacao: recrutador.apresentacao,
      linguagem: recrutador.linguagem,

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
