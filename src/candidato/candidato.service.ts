import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Prisma,
  PerfilTipo,
  AgendaStatus,
  StatusAvaliacao,
  TipoNotificacao,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { ResponderQuestionarioDto } from './dto/responder-questionario.dto';
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

  async getNotificacoesCount(usuarioId: number) {
    return this.prisma.notificacao.count({
      where: {
        usuario_id: usuarioId,
        perfil_tipo: 'CANDIDATO', // usar enum se estiver tipado
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
      perfil_tipo: PerfilTipo.CANDIDATO,
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
        perfil_tipo: PerfilTipo.CANDIDATO,
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
        perfil_tipo: PerfilTipo.CANDIDATO,
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
        perfil_tipo: PerfilTipo.CANDIDATO,
      },
    });
  }

  async listarAvaliacoesCandidato(usuarioId: number) {
    // 1️⃣ Buscar perfil candidato
    const perfilCandidato = await this.prisma.usuarioPerfilCandidato.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!perfilCandidato) {
      return {
        aguardando_questionario: [],
        agendadas: [],
        finalizadas: [],
      };
    }

    // 2️⃣ Buscar avaliações vinculadas ao candidato
    const avaliacoes = await this.prisma.candidatoAvaliacaoSkill.findMany({
      where: {
        candidatoSkill: {
          candidato_id: perfilCandidato.id,
        },

        avaliador_id: {
          not: null,
        },
      },

      include: {
        candidatoSkill: {
          include: {
            skill: true,
          },
        },

        avaliador: {
          include: {
            usuario: {
              include: {
                cidade: {
                  include: {
                    estado: true,
                  },
                },
              },
            },
          },
        },

        avaliacaoSkill: {
          include: {
            agenda: true,
            questionario: true,
          },
        },
      },

      orderBy: {
        data_avaliacao: 'desc',
      },
    });

    // =====================================================
    // COLUNAS
    // =====================================================

    // 📋 aguardando responder questionário
    const aguardando_questionario = avaliacoes.filter(
      (a) =>
        a.avaliacaoSkill.length > 0 &&
        a.avaliacaoSkill.some(
          (av) => av.questionario_id && !av.data_resposta_questionario,
        ),
    );

    // 📅 agenda enviada
    const agendadas = avaliacoes.filter((a) =>
      a.avaliacaoSkill.some(
        (av) =>
          av.status === StatusAvaliacao.AGENDA_ENVIADA ||
          av.status === StatusAvaliacao.AGENDADO,
      ),
    );

    // ✅ finalizadas
    const finalizadas = avaliacoes.filter((a) =>
      a.avaliacaoSkill.some((av) => av.status === StatusAvaliacao.FINALIZADO),
    );

    return {
      aguardando_questionario: aguardando_questionario.map((a) =>
        this.mapAvaliacaoCandidato(a),
      ),

      agendadas: agendadas.map((a) => this.mapAvaliacaoCandidato(a)),

      finalizadas: finalizadas.map((a) => this.mapAvaliacaoCandidato(a)),
    };
  }

  private mapAvaliacaoCandidato(
    avaliacao: Prisma.CandidatoAvaliacaoSkillGetPayload<{
      include: {
        candidatoSkill: {
          include: {
            skill: true;
          };
        };

        avaliador: {
          include: {
            usuario: {
              include: {
                cidade: {
                  include: {
                    estado: true;
                  };
                };
              };
            };
          };
        };

        avaliacaoSkill: {
          include: {
            agenda: true;
            questionario: true;
          };
        };
      };
    }>,
  ) {
    // Como existe apenas uma avaliação por avaliador/skill,
    // pegamos a primeira posição.
    const avaliacaoSkill = avaliacao.avaliacaoSkill[0];

    const avaliadorUsuario = avaliacao.avaliador?.usuario;

    const cidade = avaliadorUsuario?.cidade?.cidade;
    const sigla = avaliadorUsuario?.cidade?.estado?.sigla;

    return {
      id: avaliacaoSkill?.id,

      avaliador_nome: avaliadorUsuario
        ? this.getNomeExibicao(avaliadorUsuario)
        : null,

      localizacao: cidade && sigla ? `${cidade}/${sigla}` : null,

      logo: null,

      skill: avaliacao.candidatoSkill.skill.skill,

      peso: avaliacao.candidatoSkill.peso,
      peso_avaliador: avaliacaoSkill.peso,

      criado_em: avaliacaoSkill?.data_aceite ?? null,

      questionario_id: avaliacaoSkill?.questionario_id ?? null,

      data_envio_formulario: avaliacaoSkill?.data_envio_formulario ?? null,

      data_resposta_questionario:
        avaliacaoSkill?.data_resposta_questionario ?? null,

      data_agenda: avaliacaoSkill?.agenda?.data_hora_agenda ?? null,

      agenda_status: avaliacaoSkill?.agenda?.status ?? null,

      status: avaliacaoSkill?.status ?? null,

      comentario: avaliacaoSkill?.comentario ?? null,

      avaliador_id: avaliacaoSkill?.avaliador_id ?? null,

      avaliacao_id: avaliacaoSkill?.id ?? null,

      data_avaliacao: avaliacaoSkill?.data_avaliacao,
      data_agenda_criacao: avaliacaoSkill.agenda?.data_criacao ?? null,
    };
  }

  async aceitarAgenda(avaliacaoId: number) {
    const agenda = await this.prisma.avaliadorAvaliacaoSkillAgenda.findUnique({
      where: {
        avaliador_avaliacao_id: avaliacaoId,
      },
      include: {
        avaliacao: {
          include: {
            avaliador: true,
          },
        },
      },
    });

    if (!agenda) {
      throw new BadRequestException('Agenda inválida');
    }

    await this.prisma.$transaction([
      this.prisma.avaliadorAvaliacaoSkillAgenda.update({
        where: {
          avaliador_avaliacao_id: avaliacaoId,
        },
        data: {
          status: AgendaStatus.ACEITO,
        },
      }),

      this.prisma.avaliadorAvaliacaoSkill.update({
        where: {
          id: avaliacaoId,
        },
        data: {
          status: StatusAvaliacao.AGENDADO,
        },
      }),

      this.prisma.notificacao.create({
        data: {
          usuario_id: agenda.avaliacao.avaliador.usuario_id,
          perfil_tipo: PerfilTipo.AVALIADOR,
          perfil_id: 3,
          referencia_id: avaliacaoId,
          titulo: 'Agenda Aceita',
          mensagem: 'Uma sugestão de data para agendamento foi ACEITA.',
          tipo: TipoNotificacao.NOVA_MENSAGEM_AGENDA,
        },
      }),
    ]);

    return { success: true };
  }

  async recusarAgenda(avaliacaoId: number) {
    const agenda = await this.prisma.avaliadorAvaliacaoSkillAgenda.findUnique({
      where: {
        avaliador_avaliacao_id: avaliacaoId,
      },
      include: {
        avaliacao: {
          include: {
            avaliador: true,
          },
        },
      },
    });

    if (!agenda) {
      throw new BadRequestException('Agenda inválida');
    }

    await this.prisma.avaliadorAvaliacaoSkillAgenda.update({
      where: {
        avaliador_avaliacao_id: avaliacaoId,
      },
      data: {
        status: AgendaStatus.RECUSADO,
      },
    });

    await this.prisma.notificacao.create({
      data: {
        usuario_id: agenda.avaliacao.avaliador.usuario_id,
        perfil_tipo: PerfilTipo.AVALIADOR,
        perfil_id: 3,
        referencia_id: avaliacaoId,
        titulo: 'Agenda Recusada',
        mensagem: 'Uma sugestão de data para agendamento foi RECUSADA.',
        tipo: TipoNotificacao.NOVA_MENSAGEM_AGENDA,
      },
    });

    return { success: true };
  }

  async buscarQuestionario(avaliacaoId: number, usuarioId: number) {
    const avaliacao = await this.prisma.avaliadorAvaliacaoSkill.findFirst({
      where: {
        id: avaliacaoId,

        candidatoSkill: {
          candidatoSkill: {
            candidato: {
              usuario_id: usuarioId,
            },
          },
        },
      },

      select: {
        id: true,

        questionario: {
          select: {
            id: true,
            titulo: true,
            comentario: true,

            pergunta: {
              where: {
                ativo: true,
              },

              orderBy: {
                ordem: 'asc',
              },

              select: {
                id: true,
                ordem: true,
                pergunta: true,
                tipo_pergunta: true,
                obrigatorio: true,
              },
            },
          },
        },

        candidatoSkill: {
          select: {
            candidatoSkill: {
              select: {
                skill: {
                  select: {
                    skill: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!avaliacao) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    if (!avaliacao.questionario) {
      throw new BadRequestException('Questionário não encontrado');
    }

    return {
      avaliacaoId: avaliacao.id,

      questionarioId: avaliacao.questionario.id,

      skill: avaliacao.candidatoSkill.candidatoSkill.skill.skill,

      titulo: avaliacao.questionario.titulo,

      comentario: avaliacao.questionario.comentario,

      perguntas: avaliacao.questionario.pergunta.map((item) => ({
        id: item.id,
        ordem: item.ordem,
        pergunta: item.pergunta,
        tipo: item.tipo_pergunta,
        obrigatorio: item.obrigatorio,
      })),
    };
  }

  async responderQuestionario(
    avaliacaoId: number,
    usuarioId: number,
    dto: ResponderQuestionarioDto,
  ) {
    const avaliacao = await this.prisma.avaliadorAvaliacaoSkill.findFirst({
      where: {
        id: avaliacaoId,

        candidatoSkill: {
          candidatoSkill: {
            candidato: {
              usuario_id: usuarioId,
            },
          },
        },
      },

      select: {
        id: true,
        status: true,
        data_resposta_questionario: true,
        avaliador: true,

        questionario: {
          select: {
            pergunta: {
              where: {
                ativo: true,
              },

              select: {
                id: true,
                obrigatorio: true,
              },
            },
          },
        },
      },
    });

    if (!avaliacao) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    if (avaliacao.status !== StatusAvaliacao.QUESTIONARIO_ENVIADO) {
      throw new BadRequestException(
        'Questionário não disponível para resposta',
      );
    }

    if (avaliacao.data_resposta_questionario) {
      throw new BadRequestException('Questionário já respondido');
    }

    const perguntas = avaliacao.questionario?.pergunta ?? [];

    const perguntasValidas = new Set(perguntas.map((p) => p.id));

    const perguntasObrigatorias = new Set(
      perguntas.filter((p) => p.obrigatorio).map((p) => p.id),
    );

    const respostasPreenchidas = dto.respostas.filter((r) =>
      perguntasValidas.has(r.perguntaId),
    );

    const obrigatoriasRespondidas = new Set(
      respostasPreenchidas.map((r) => r.perguntaId),
    );

    const faltandoObrigatorias = [...perguntasObrigatorias].filter(
      (id) => !obrigatoriasRespondidas.has(id),
    );

    if (faltandoObrigatorias.length > 0) {
      throw new BadRequestException(
        'Existem perguntas obrigatórias sem resposta',
      );
    }

    await this.prisma.$transaction([
      this.prisma.avaliadorAvaliacaoSkillResposta.createMany({
        data: respostasPreenchidas.map((r) => ({
          avaliador_avaliacao_id: avaliacao.id,

          questionario_pergunta_id: r.perguntaId,

          resposta: r.resposta?.trim(),
        })),
      }),

      this.prisma.avaliadorAvaliacaoSkill.update({
        where: {
          id: avaliacao.id,
        },

        data: {
          data_resposta_questionario: new Date(),
        },
      }),

      this.prisma.notificacao.create({
        data: {
          usuario_id: avaliacao.avaliador.usuario_id,
          perfil_tipo: PerfilTipo.AVALIADOR,
          perfil_id: 3,
          referencia_id: avaliacaoId,
          titulo: 'Questionário Respondido',
          mensagem: 'Um questionário enviado para avaliação foi respondido.',
          tipo: TipoNotificacao.NOVA_MENSAGEM_FORMULARIO,
        },
      }),
    ]);

    return {
      sucesso: true,
      mensagem: 'Questionário respondido com sucesso',
    };
  }

  async buscarDetalheAvaliacao(avaliacaoId: number, usuarioId: number) {
    const avaliacao = await this.prisma.avaliadorAvaliacaoSkill.findFirst({
      where: {
        id: avaliacaoId,

        candidatoSkill: {
          candidatoSkill: {
            candidato: {
              usuario_id: usuarioId,
            },
          },
        },
      },

      select: {
        peso: true,
        data_avaliacao: true,
        data_resposta_questionario: true,
        comentario: true,

        agenda: {
          select: {
            data_hora_agenda: true,
          },
        },
        questionario: {
          select: {
            titulo: true,
          },
        },

        candidatoSkill: {
          select: {
            candidatoSkill: {
              select: {
                peso: true,

                skill: {
                  select: {
                    skill: true,
                  },
                },
              },
            },
          },
        },

        resposta: {
          orderBy: {
            pergunta: {
              ordem: 'asc',
            },
          },

          select: {
            resposta: true,

            pergunta: {
              select: {
                pergunta: true,
              },
            },
          },
        },
      },
    });

    if (!avaliacao) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    return {
      skill: avaliacao.candidatoSkill.candidatoSkill.skill.skill,

      // autoavaliação do candidato
      peso: avaliacao.candidatoSkill.candidatoSkill.peso / 10,

      // nota do avaliador
      peso_avaliador: (avaliacao.peso ?? 10) / 10,

      data_avaliacao: avaliacao.data_avaliacao,

      data_entrevista: avaliacao.agenda?.data_hora_agenda ?? null,

      data_resposta_questionario: avaliacao.data_resposta_questionario,
      questionario_titulo: avaliacao.questionario?.titulo,
      comentario: avaliacao.comentario,

      respostas: avaliacao.resposta.map((item) => ({
        pergunta: item.pergunta.pergunta,
        resposta: item.resposta ?? '',
      })),
    };
  }

  async buscarAgendaCandidato(usuarioId: number) {
    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);

    const agendas = await this.prisma.avaliadorAvaliacaoSkillAgenda.findMany({
      where: {
        status: AgendaStatus.ACEITO,

        // data_hora_agenda: {
        //   gte: hoje,
        // },

        avaliacao: {
          candidatoSkill: {
            candidatoSkill: {
              candidato: {
                usuario_id: usuarioId,
              },
            },
          },
        },
      },

      orderBy: {
        data_hora_agenda: 'asc',
      },

      select: {
        id: true,
        data_hora_agenda: true,

        avaliacao: {
          select: {
            id: true,

            candidatoSkill: {
              select: {
                candidatoSkill: {
                  select: {
                    peso: true,

                    skill: {
                      select: {
                        skill: true,
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

    return agendas.map((item) => ({
      id: item.id,
      avaliacaoId: item.avaliacao.id,
      data_hora: item.data_hora_agenda,
      skill: item.avaliacao.candidatoSkill.candidatoSkill.skill.skill,
      autoavaliacao: item.avaliacao.candidatoSkill.candidatoSkill.peso,
    }));
  }
}
