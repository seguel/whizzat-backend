import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
/* import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  empresaId: number;
} */

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

export interface CandidatoSkillDto {
  id: number;
  candidato_id: number;
  skill_id: number;
  peso: number;
  favorito: boolean;
  tempo_favorito: string;
  nome: string;
  tipo_skill_id: number;
}

export interface CandidatoCertificacaoDto {
  id: number;
  candidato_id: number;
  certificacao_id: number;
  certificado: string;
  certificado_file: string;
}

export interface CandidatoDto {
  id: number;
  usuario_id: number;
  perfil_id: number;
  telefone: string;
  localizacao: string | null;
  apresentacao: string;
  logo?: string;
  meio_notificacao: string;
  ativo: boolean;
  skills: CandidatoSkillDto[];
  certificacoes: CandidatoCertificacaoDto[];
  usuario: UsuarioDto;
}

@Injectable()
export class CandidatoService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async getCheckHasPerfil(
    usuarioId: number,
    perfilId: number,
  ): Promise<{ id: number | null; usuario_id: number; redirect_to: string }> {
    const registro = await this.prisma.usuarioPerfilCandidato.findUnique({
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
  ): Promise<{ id: number | null; usuario_id: number; nome_user: string }> {
    const registro = await this.prisma.usuarioPerfilCandidato.findUnique({
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

  async getCandidato(
    id: number,
    usuarioId: number,
    perfilId: number,
    lang: string,
  ): Promise<CandidatoDto> {
    const candidato = await this.prisma.usuarioPerfilCandidato.findFirstOrThrow(
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

    const usr = candidato.usuario;

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
    const certificacoes: CandidatoCertificacaoDto[] =
      candidato.certificacoes.map((s) => ({
        id: s.id,
        candidato_id: s.candidato_id,
        certificacao_id: s.certificacao_id,
        certificado: s.certificacoes.certificado,
        certificado_file: s.certificado_file,
      }));

    const skills: CandidatoSkillDto[] = candidato.skills.map((s) => ({
      id: s.id,
      candidato_id: s.candidato_id,
      skill_id: s.skill_id,
      peso: s.peso,
      favorito: s.favorito,
      tempo_favorito: s.tempo_favorito,
      nome: s.skill.skill, // pega direto o texto da skill
      tipo_skill_id: s.skill.tipo_skill_id,
    }));

    return {
      ...candidato,
      skills,
      certificacoes,
      usuario,
    };
  }

  async createCandidato(data: {
    usuario_id: number;
    perfil_id: number;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    logo?: string;
    meio_notificacao: string;
    language: string;
  }) {
    const createData: Prisma.UsuarioPerfilCandidatoCreateInput = {
      usuario: {
        connect: { id: data.usuario_id },
      },
      perfil: {
        connect: { id: data.perfil_id },
      },
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      logo: data.logo ?? '',
      meio_notificacao: data.meio_notificacao,
      linguagem: data.language,
    };

    const candidato = await this.prisma.usuarioPerfilCandidato.create({
      data: createData,
    });

    return {
      id: candidato.id,
    };
  }

  async updateCandidato(data: {
    candidato_id: number;
    usuario_id: number;
    perfil_id: number;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    logo?: string;
    meio_notificacao: string;
    ativo: boolean;
    language: string;
  }) {
    const updateData: Prisma.UsuarioPerfilCandidatoUpdateInput = {
      telefone: data.telefone,
      localizacao: data.localizacao,
      apresentacao: data.apresentacao,
      logo: data.logo ?? '',
      meio_notificacao: data.meio_notificacao,
      ativo: data.ativo,
    };

    return this.prisma.usuarioPerfilCandidato.update({
      where: { id: data.candidato_id },
      data: updateData,
    });
  }

  async createCandidatoSkills(skills: Prisma.CandidatoSkillCreateManyInput[]) {
    return this.prisma.candidatoSkill.createMany({
      data: skills,
    });
  }

  async updateCandidatoSkills(
    candidato_id: number,
    skills: {
      candidato_id: number;
      skill_id: number;
      peso: number;
      favorito: boolean;
      tempo_favorito: string;
    }[],
  ) {
    // Busca skills atuais do candidato
    const existentes = await this.prisma.candidatoSkill.findMany({
      where: { candidato_id },
    });

    const idsExistentes = existentes.map((s) => s.skill_id);
    const idsNovos = skills.map((s) => s.skill_id);

    // 🔹 Remove apenas as skills que não estão mais no novo array
    const paraRemover = idsExistentes.filter((id) => !idsNovos.includes(id));
    if (paraRemover.length > 0) {
      await this.prisma.candidatoSkill.deleteMany({
        where: { candidato_id, skill_id: { in: paraRemover } },
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
          await this.prisma.candidatoSkill.updateMany({
            where: { candidato_id, skill_id: s.skill_id },
            data: {
              peso: s.peso,
              favorito: s.favorito,
              tempo_favorito: s.tempo_favorito,
            },
          });
        }
      } else {
        // Cria nova
        await this.prisma.candidatoSkill.create({ data: s });
      }
    }
  }

  async createCandidatoFormacao(
    formacoes: Prisma.CandidatoFormacaoAcademicaCreateManyInput[],
  ) {
    return await this.prisma.candidatoFormacaoAcademica.createMany({
      data: formacoes,
    });
  }

  async updateCandidatoFormacao(
    candidato_id: number,
    formacoes: {
      candidato_id: number;
      graduacao_id: number;
      formacao: string;
      certificado_file: string;
    }[],
  ) {
    // Busca formacoes atuais no banco
    const existentes = await this.prisma.candidatoFormacaoAcademica.findMany({
      where: { candidato_id },
    });

    // IDs atuais e novos
    const idsExistentes = existentes.map((f) => f.graduacao_id);
    const idsNovos = formacoes.map((f) => f.graduacao_id);

    // Remove apenas as formações que não estão mais no novo array
    const paraRemover = idsExistentes.filter((id) => !idsNovos.includes(id));
    if (paraRemover.length > 0) {
      await this.prisma.candidatoFormacaoAcademica.deleteMany({
        where: { candidato_id, graduacao_id: { in: paraRemover } },
      });
    }

    // Atualiza ou cria
    for (const f of formacoes) {
      const existente = existentes.find(
        (e) => e.graduacao_id === f.graduacao_id,
      );
      if (existente) {
        await this.prisma.candidatoFormacaoAcademica.updateMany({
          where: { candidato_id, graduacao_id: f.graduacao_id },
          data: {
            formacao: f.formacao,
            certificado_file: f.certificado_file || existente.certificado_file,
          },
        });
      } else {
        await this.prisma.candidatoFormacaoAcademica.create({
          data: f,
        });
      }
    }
  }

  async createCandidatoCertificacoes(
    certificacoes: Prisma.CandidatoCertificacoesCreateManyInput[],
  ) {
    return await this.prisma.candidatoCertificacoes.createMany({
      data: certificacoes,
    });
  }

  async updateCandidatoCertificacoes(
    candidato_id: number,
    certificacoes: {
      candidato_id: number;
      certificacao_id: number;
      certificado_file: string;
    }[],
  ) {
    // Busca certificações atuais no banco
    const existentes = await this.prisma.candidatoCertificacoes.findMany({
      where: { candidato_id },
    });

    const idsExistentes = existentes.map((c) => c.certificacao_id);
    const idsNovos = certificacoes.map((c) => c.certificacao_id);

    // Remove apenas as que sumiram
    const paraRemover = idsExistentes.filter((id) => !idsNovos.includes(id));
    if (paraRemover.length > 0) {
      await this.prisma.candidatoCertificacoes.deleteMany({
        where: { candidato_id, certificacao_id: { in: paraRemover } },
      });
    }

    // Atualiza ou cria
    for (const c of certificacoes) {
      const existente = existentes.find(
        (e) => e.certificacao_id === c.certificacao_id,
      );
      if (existente) {
        await this.prisma.candidatoCertificacoes.updateMany({
          where: { candidato_id, certificacao_id: c.certificacao_id },
          data: {
            certificado_file: c.certificado_file || existente.certificado_file,
          },
        });
      } else {
        await this.prisma.candidatoCertificacoes.create({
          data: c,
        });
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
