import {
  PublicoAfirmativo,
  TipoOportunidade,
  StatusConviteRecrutador,
  TipoConviteRecrutador,
  PerfilTipo,
  TipoNotificacao,
  AgendaStatus,
} from '@prisma/client';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { FaixaMatch } from './dto/buscar-candidatos-vaga.dto';
import { BuscarCandidatosDto } from './dto/buscar-candidatos.dto';
import { CriarConviteVagaDto } from './dto/criar-convite-vaga.dto';
import { CriarConviteManualDto } from './dto/criar-convite-manual.dto';
import { RespostaConviteCandidato } from './dto/responder-convite-candidato.dto';
import { RespostaAgendaCandidato } from './dto/responder-agenda-candidato.dto';

interface CriterioSkillMatch {
  skill_id: number;
  peso: number;

  skill: {
    tipo_skill_id: number;
  };
}

interface CriteriosMatch {
  skills: CriterioSkillMatch[];
  modalidade_codigo?: string;
  cidade_id?: number | null;
  tipo_oportunidade?: TipoOportunidade;
  publicos_afirmativos?: PublicoAfirmativo[];
  faixa: FaixaMatch;
  limite: number;
}

@Injectable()
export class CandidateMatchService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MATCH_MINIMO: Record<FaixaMatch, number> = {
    [FaixaMatch.ALTA]: 90,
    [FaixaMatch.BOA]: 75,
    [FaixaMatch.COMPATIVEL]: 60,
    [FaixaMatch.TODOS]: 0,
  };

  async buscarPorVaga({
    vagaId,
    empresaId,
    usuarioId,
    lang,
    limite,
    faixa,
  }: {
    vagaId: number;
    empresaId: number;
    usuarioId: number;
    lang: string;
    limite: number;
    faixa: FaixaMatch;
  }) {
    const recrutador = await this.validarAcessoRecrutador(usuarioId, empresaId);

    const vaga = await this.buscarVagaParaMatch(vagaId, empresaId);

    this.validarPrazoVaga(vaga.data_cadastro, vaga.qtde_dias_aberta);

    const criterios: CriteriosMatch = {
      skills: vaga.skills,
      modalidade_codigo: vaga.modalidade_trabalho.codigo,
      cidade_id:
        vaga.modalidade_trabalho.codigo.trim().toUpperCase() === 'REMOTO'
          ? null
          : vaga.cidade_id,
      tipo_oportunidade: vaga.tipo_oportunidade,
      publicos_afirmativos: vaga.publicos_afirmativos.map(
        (item) => item.codigo,
      ),

      faixa,
      limite,
    };

    const candidatos = await this.executarMatch({
      recrutadorId: recrutador.id,
      linguagem: vaga.empresa.linguagem,
      criterios,
    });

    const candidatoIds = candidatos.map((candidato) => candidato.candidato_id);

    const convitesExistentes =
      candidatoIds.length > 0
        ? await this.prisma.recrutadorConviteCandidato.findMany({
            where: {
              vaga_id: vaga.vaga_id,
              candidato_id: {
                in: candidatoIds,
              },
            },
            select: {
              candidato_id: true,
            },
          })
        : [];

    const candidatoIdsConvidados = new Set(
      convitesExistentes.map((convite) => convite.candidato_id),
    );

    const candidatosComConvite = candidatos.map((candidato) => ({
      ...candidato,
      ja_convidado: candidatoIdsConvidados.has(candidato.candidato_id),
    }));

    return {
      vaga: {
        vaga_id: vaga.vaga_id,
        empresa_id: vaga.empresa_id,
        nome_vaga: vaga.nome_vaga,

        tipo_oportunidade: vaga.tipo_oportunidade,

        publicos_afirmativos: vaga.publicos_afirmativos.map(
          (item) => item.codigo,
        ),

        modalidade: vaga.modalidade_trabalho.codigo,

        cidade_id: vaga.cidade_id,

        skills: vaga.skills.map((item) => ({
          skill_id: item.skill_id,
          peso: item.peso,
          tipo_skill_id: item.skill.tipo_skill_id,
        })),
      },

      parametros: {
        limite,
        faixa,
        lang,
      },

      candidatos: candidatosComConvite,
    };
  }

  private async buscarVagaParaMatch(vagaId: number, empresaId: number) {
    const vaga = await this.prisma.empresaVaga.findFirst({
      where: {
        vaga_id: vagaId,
        empresa_id: empresaId,
        ativo: true,
      },

      select: {
        vaga_id: true,
        empresa_id: true,
        nome_vaga: true,

        tipo_oportunidade: true,

        cidade_id: true,

        data_cadastro: true,
        qtde_dias_aberta: true,

        modalidade_trabalho: {
          select: {
            codigo: true,
          },
        },

        publicos_afirmativos: {
          select: {
            codigo: true,
          },
        },

        skills: {
          select: {
            skill_id: true,
            peso: true,

            skill: {
              select: {
                tipo_skill_id: true,
              },
            },
          },
        },
        empresa: {
          select: {
            linguagem: true,
          },
        },
      },
    });

    if (!vaga) {
      throw new NotFoundException(
        'Vaga não encontrada, inativa ou não pertence à empresa informada.',
      );
    }

    return vaga;
  }

  private validarPrazoVaga(dataCadastro: Date, qtdeDiasAberta: number) {
    const prazo = new Date(dataCadastro);

    prazo.setDate(prazo.getDate() + qtdeDiasAberta);

    if (prazo < new Date()) {
      throw new BadRequestException(
        'Não é possível buscar candidatos para uma vaga encerrada.',
      );
    }
  }

  private async validarAcessoRecrutador(usuarioId: number, empresaId: number) {
    const recrutador = await this.prisma.usuarioPerfilRecrutador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,

        empresas: {
          some: {
            id: empresaId,
            ativo: true,
          },
        },
      },

      select: {
        id: true,
      },
    });

    if (!recrutador) {
      throw new BadRequestException(
        'Usuário não possui acesso à empresa informada.',
      );
    }

    return recrutador;
  }

  private async buscarCandidatosBase(lang: string, recrutadorId: number) {
    return this.prisma.usuarioPerfilCandidato.findMany({
      where: {
        ativo: true,
        aberto_oportunidades: true,
        linguagem: lang,

        usuario: {
          ativo: true,
        },

        exclusoes_recrutador: {
          none: {
            recrutador_id: recrutadorId,
            ativo: true,
          },
        },
      },

      select: {
        id: true,
        usuario_id: true,
        logo: true,

        oportunidade_pcd: true,
        oportunidade_afirmativa_racial: true,
        oportunidade_lgbtqia: true,
        oportunidade_50mais: true,
        oportunidade_diversidade: true,

        usuario: {
          select: {
            primeiro_nome: true,
            ultimo_nome: true,
            nome_social: true,

            cidade_id: true,
            genero_id: true,

            genero: {
              select: {
                genero: true,
              },
            },

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

        candidatoModalidadeTrabalhos: {
          select: {
            modalidade: {
              select: {
                codigo: true,
              },
            },
          },
        },

        skills: {
          select: {
            skill_id: true,
            peso: true,
            peso_avaliador: true,

            skill: {
              select: {
                tipo_skill_id: true,
              },
            },
          },
        },
      },
    });
  }

  private isModalidadeCompativel(
    modalidadeVaga: string,
    modalidadesCandidato: string[],
  ): boolean {
    const modalidade = modalidadeVaga.toUpperCase();

    const modalidades = modalidadesCandidato.map((item) => item.toUpperCase());

    /*
     * O candidato precisa ter indicado que aceita
     * a modalidade de trabalho exigida pela vaga.
     */
    return modalidades.includes(modalidade);
  }

  private isPublicoAfirmativoCompativel(
    tipoOportunidade: TipoOportunidade,
    publicosVaga: PublicoAfirmativo[],
    candidato: {
      oportunidade_pcd: boolean;
      oportunidade_afirmativa_racial: boolean;
      oportunidade_lgbtqia: boolean;
      oportunidade_50mais: boolean;
      oportunidade_diversidade: boolean;

      usuario: {
        genero: {
          genero: string;
        };
      };
    },
  ): boolean {
    if (tipoOportunidade === TipoOportunidade.AMPLA_CONCORRENCIA) {
      return true;
    }

    if (tipoOportunidade === TipoOportunidade.AFIRMATIVA) {
      return true;
    }

    if (tipoOportunidade !== TipoOportunidade.EXCLUSIVA) {
      return true;
    }

    if (publicosVaga.length === 0) {
      return false;
    }

    return publicosVaga.some((publico) =>
      this.candidatoAtendePublicoAfirmativo(publico, candidato),
    );
  }

  private candidatoAtendePublicoAfirmativo(
    publico: PublicoAfirmativo,
    candidato: {
      oportunidade_pcd: boolean;
      oportunidade_afirmativa_racial: boolean;
      oportunidade_lgbtqia: boolean;
      oportunidade_50mais: boolean;
      oportunidade_diversidade: boolean;

      usuario: {
        genero: {
          genero: string;
        };
      };
    },
  ): boolean {
    switch (publico) {
      case PublicoAfirmativo.PCD:
        return candidato.oportunidade_pcd;

      case PublicoAfirmativo.AFIRMATIVA_RACIAL:
        return candidato.oportunidade_afirmativa_racial;

      case PublicoAfirmativo.LGBTQIA:
        return candidato.oportunidade_lgbtqia;

      case PublicoAfirmativo.CINQUENTA_MAIS:
        return candidato.oportunidade_50mais;

      case PublicoAfirmativo.DIVERSIDADE:
        return candidato.oportunidade_diversidade;

      case PublicoAfirmativo.MULHERES:
        return (
          candidato.usuario.genero.genero.trim().toLowerCase() === 'feminino'
        );

      default:
        return false;
    }
  }

  private candidatoPertencePublicoAfirmativo(
    publicosVaga: PublicoAfirmativo[],
    candidato: {
      oportunidade_pcd: boolean;
      oportunidade_afirmativa_racial: boolean;
      oportunidade_lgbtqia: boolean;
      oportunidade_50mais: boolean;
      oportunidade_diversidade: boolean;

      usuario: {
        genero: {
          genero: string;
        };
      };
    },
  ): boolean {
    if (publicosVaga.length === 0) {
      return false;
    }

    return publicosVaga.some((publico) =>
      this.candidatoAtendePublicoAfirmativo(publico, candidato),
    );
  }

  private calcularScoreSkills(
    skillsVaga: {
      skill_id: number;
      peso: number;
      skill: {
        tipo_skill_id: number;
      };
    }[],
    skillsCandidato: {
      skill_id: number;
      peso: number;
      peso_avaliador: number | null;
      skill: {
        tipo_skill_id: number;
      };
    }[],
  ) {
    if (skillsVaga.length === 0) {
      return {
        score: 0,
        hard_skills: 0,
        soft_skills: 0,
        skills_avaliadas: 0,
        total_skills: 0,
        detalhes: [],
      };
    }

    const detalhes = skillsVaga.map((skillVaga) => {
      const skillCandidato = skillsCandidato.find(
        (item) => item.skill_id === skillVaga.skill_id,
      );

      if (!skillCandidato) {
        return {
          skill_id: skillVaga.skill_id,
          tipo_skill_id: skillVaga.skill.tipo_skill_id,
          nivel_vaga: skillVaga.peso,
          nivel_candidato: 0,
          avaliada: false,
          percentual: 0,
        };
      }

      const nivelCandidato =
        skillCandidato.peso_avaliador != null
          ? skillCandidato.peso_avaliador
          : skillCandidato.peso;

      const percentual =
        skillVaga.peso > 0
          ? Math.min(nivelCandidato / skillVaga.peso, 1) * 100
          : 0;

      return {
        skill_id: skillVaga.skill_id,
        tipo_skill_id: skillVaga.skill.tipo_skill_id,
        nivel_vaga: skillVaga.peso,
        nivel_candidato: nivelCandidato,
        avaliada: skillCandidato.peso_avaliador != null,
        percentual,
      };
    });

    const calcularMedia = (skills: typeof detalhes): number => {
      if (skills.length === 0) {
        return 0;
      }

      const soma = skills.reduce((total, skill) => total + skill.percentual, 0);

      return Math.round(soma / skills.length);
    };

    const hardSkills = detalhes.filter((skill) => skill.tipo_skill_id === 1);

    const softSkills = detalhes.filter((skill) => skill.tipo_skill_id === 2);

    const score = calcularMedia(detalhes);
    const hardSkillsScore = calcularMedia(hardSkills);
    const softSkillsScore = calcularMedia(softSkills);

    const skillsAvaliadas = detalhes.filter((skill) => skill.avaliada).length;

    return {
      score,
      hard_skills: hardSkillsScore,
      soft_skills: softSkillsScore,
      skills_avaliadas: skillsAvaliadas,
      total_skills: skillsVaga.length,
      detalhes,
    };
  }

  private isLocalizacaoCompativel(
    modalidadeVaga: string,
    cidadeVagaId: number,
    cidadeCandidatoId: number,
  ): boolean {
    const modalidade = modalidadeVaga.trim().toUpperCase();

    /*
     * Para trabalho remoto, localização não elimina candidato.
     */
    if (modalidade === 'REMOTO') {
      return true;
    }

    /*
     * Para presencial e híbrido, nesta primeira versão
     * exigimos que candidato e vaga estejam na mesma cidade.
     */
    if (modalidade === 'PRESENCIAL' || modalidade === 'HIBRIDO') {
      return cidadeVagaId === cidadeCandidatoId;
    }

    /*
     * Segurança:
     * modalidade desconhecida não deve liberar candidato
     * silenciosamente.
     */
    return false;
  }

  async ignorarCandidato({
    usuarioId,
    candidatoId,
    motivo,
  }: {
    usuarioId: number;
    candidatoId: number;
    motivo: string | null;
  }) {
    const recrutador = await this.prisma.usuarioPerfilRecrutador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!recrutador) {
      throw new BadRequestException(
        'Perfil de recrutador não encontrado ou inativo.',
      );
    }

    const candidato = await this.prisma.usuarioPerfilCandidato.findFirst({
      where: {
        id: candidatoId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!candidato) {
      throw new NotFoundException('Candidato não encontrado ou inativo.');
    }

    await this.prisma.recrutadorCandidatoExclusao.upsert({
      where: {
        recrutador_id_candidato_id: {
          recrutador_id: recrutador.id,
          candidato_id: candidatoId,
        },
      },

      update: {
        ativo: true,
        motivo,
        data_cadastro: new Date(),
      },

      create: {
        recrutador_id: recrutador.id,
        candidato_id: candidatoId,
        motivo,
        ativo: true,
      },
    });

    return {
      sucesso: true,
      candidato_id: candidatoId,
    };
  }

  private async buscarRecrutadorPorUsuario(usuarioId: number) {
    const recrutador = await this.prisma.usuarioPerfilRecrutador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },

      select: {
        id: true,
        linguagem: true,
      },
    });

    if (!recrutador) {
      throw new BadRequestException(
        'Perfil de recrutador não encontrado ou inativo.',
      );
    }

    return recrutador;
  }

  async listarIgnorados(usuarioId: number) {
    const recrutador = await this.buscarRecrutadorPorUsuario(usuarioId);

    const ignorados = await this.prisma.recrutadorCandidatoExclusao.findMany({
      where: {
        recrutador_id: recrutador.id,
        ativo: true,
      },

      orderBy: {
        data_cadastro: 'desc',
      },

      select: {
        candidato_id: true,
        motivo: true,
        data_cadastro: true,

        candidato: {
          select: {
            id: true,
            logo: true,

            usuario: {
              select: {
                primeiro_nome: true,
                ultimo_nome: true,
                nome_social: true,

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
    });

    return ignorados.map((item) => ({
      candidato_id: item.candidato_id,

      nome:
        item.candidato.usuario.nome_social?.trim() ||
        `${item.candidato.usuario.primeiro_nome} ${item.candidato.usuario.ultimo_nome}`.trim(),

      logo: item.candidato.logo,

      localizacao: item.candidato.usuario.cidade
        ? `${item.candidato.usuario.cidade.cidade}/${item.candidato.usuario.cidade.estado.sigla}`
        : null,

      motivo: item.motivo,
      data_ignorado: item.data_cadastro,
    }));
  }

  async restaurarCandidato({
    usuarioId,
    candidatoId,
  }: {
    usuarioId: number;
    candidatoId: number;
  }) {
    const recrutador = await this.buscarRecrutadorPorUsuario(usuarioId);

    const resultado = await this.prisma.recrutadorCandidatoExclusao.updateMany({
      where: {
        recrutador_id: recrutador.id,
        candidato_id: candidatoId,
        ativo: true,
      },

      data: {
        ativo: false,
      },
    });

    if (resultado.count === 0) {
      throw new NotFoundException('Candidato ignorado não encontrado.');
    }

    return {
      sucesso: true,
      candidato_id: candidatoId,
    };
  }

  async restaurarCandidatos({
    usuarioId,
    candidatoIds,
  }: {
    usuarioId: number;
    candidatoIds: number[];
  }) {
    const recrutador = await this.buscarRecrutadorPorUsuario(usuarioId);

    const idsUnicos = [...new Set(candidatoIds)];

    const resultado = await this.prisma.recrutadorCandidatoExclusao.updateMany({
      where: {
        recrutador_id: recrutador.id,
        candidato_id: {
          in: idsUnicos,
        },
        ativo: true,
      },

      data: {
        ativo: false,
      },
    });

    return {
      sucesso: true,
      restaurados: resultado.count,
    };
  }

  async buscarPerfilCandidato({
    usuarioId,
    candidatoId,
  }: {
    usuarioId: number;
    candidatoId: number;
  }) {
    const recrutador = await this.buscarRecrutadorPorUsuario(usuarioId);

    const candidato = await this.prisma.usuarioPerfilCandidato.findFirst({
      where: {
        id: candidatoId,
        ativo: true,
        usuario: {
          ativo: true,
        },
      },

      select: {
        id: true,
        apresentacao: true,
        logo: true,
        aberto_oportunidades: true,

        usuario: {
          select: {
            primeiro_nome: true,
            ultimo_nome: true,
            nome_social: true,

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

        skills: {
          select: {
            peso: true,
            peso_avaliador: true,
            data_ultima_avaliacao: true,

            skill: {
              select: {
                skill_id: true,
                skill: true,
                tipo_skill_id: true,
              },
            },
          },
        },

        formacao: {
          select: {
            id: true,
            graduacao_id: true,
            formacao: true,
            certificado_file: true,

            graduacao: {
              select: {
                id: true,
                graduacao: true,
              },
            },
          },
        },

        certificacoes: {
          select: {
            id: true,
            certificacao_id: true,
            certificado_file: true,

            certificacoes: {
              select: {
                id: true,
                certificado: true,
              },
            },
          },
        },

        candidatoModalidadeTrabalhos: {
          select: {
            modalidade_id: true,

            modalidade: {
              select: {
                modalidade_trabalho_id: true,
                modalidade: true,
                codigo: true,
              },
            },
          },
        },

        exclusoes_recrutador: {
          where: {
            recrutador_id: recrutador.id,
            ativo: true,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!candidato) {
      throw new NotFoundException('Candidato não encontrado.');
    }

    if (candidato.exclusoes_recrutador.length > 0) {
      throw new BadRequestException(
        'Este candidato está ignorado pelo recrutador.',
      );
    }

    const nome =
      candidato.usuario.nome_social?.trim() ||
      `${candidato.usuario.primeiro_nome} ${candidato.usuario.ultimo_nome}`.trim();

    const localizacao = candidato.usuario.cidade
      ? `${candidato.usuario.cidade.cidade}/${candidato.usuario.cidade.estado.sigla}`
      : null;

    const skills = candidato.skills.map((item) => {
      const nivel =
        item.peso_avaliador != null ? item.peso_avaliador : item.peso;

      return {
        skill_id: item.skill.skill_id,
        nome: item.skill.skill,
        tipo_skill_id: item.skill.tipo_skill_id,
        nivel,
        avaliado: item.peso_avaliador != null,
        data_ultima_avaliacao: item.data_ultima_avaliacao,
      };
    });

    return {
      candidato_id: candidato.id,
      nome,
      logo: candidato.logo,
      localizacao,
      apresentacao: candidato.apresentacao,

      modalidades: candidato.candidatoModalidadeTrabalhos.map((item) => ({
        modalidade_id: item.modalidade.modalidade_trabalho_id,
        codigo: item.modalidade.codigo,
        nome: item.modalidade.modalidade,
      })),

      hard_skills: skills.filter((item) => item.tipo_skill_id === 1),

      soft_skills: skills.filter((item) => item.tipo_skill_id === 2),

      formacao: candidato.formacao.map((item) => ({
        id: item.id,
        graduacao_id: item.graduacao_id,
        graduacao: item.graduacao.graduacao,
        formacao: item.formacao,
        certificado_file: item.certificado_file,
      })),

      certificacoes: candidato.certificacoes.map((item) => ({
        id: item.id,
        certificacao_id: item.certificacao_id,
        certificacao: item.certificacoes.certificado,
        certificado_file: item.certificado_file,
      })),
    };
  }

  async buscarManual({
    usuarioId,
    criterios,
  }: {
    usuarioId: number;
    criterios: BuscarCandidatosDto;
  }) {
    const recrutador = await this.buscarRecrutadorPorUsuario(usuarioId);

    const skillIds = criterios.skills.map((item) => item.skill_id);

    const skillIdsUnicos = [...new Set(skillIds)];

    if (skillIdsUnicos.length !== criterios.skills.length) {
      throw new BadRequestException(
        'Não é permitido informar a mesma skill mais de uma vez.',
      );
    }

    const skillsBanco = await this.prisma.skill.findMany({
      where: {
        skill_id: {
          in: skillIdsUnicos,
        },
      },

      select: {
        skill_id: true,
        tipo_skill_id: true,
      },
    });

    if (skillsBanco.length !== skillIdsUnicos.length) {
      throw new BadRequestException(
        'Uma ou mais skills informadas são inválidas.',
      );
    }

    const skillsMatch = criterios.skills.map((item) => {
      const skillBanco = skillsBanco.find(
        (skill) => skill.skill_id === item.skill_id,
      );

      if (!skillBanco) {
        throw new BadRequestException('Skill inválida.');
      }

      return {
        skill_id: item.skill_id,
        peso: item.peso,

        skill: {
          tipo_skill_id: skillBanco.tipo_skill_id,
        },
      };
    });

    const candidatos = await this.executarMatch({
      recrutadorId: recrutador.id,
      linguagem: recrutador.linguagem,

      criterios: {
        skills: skillsMatch,
        faixa: criterios.faixa,
        limite: criterios.limite,
      },
    });

    const candidatoIds: number[] = candidatos.map((item) =>
      Number(item.candidato_id),
    );

    const convitesExistentes =
      await this.prisma.recrutadorConviteCandidato.findMany({
        where: {
          recrutador_id: recrutador.id,
          candidato_id: {
            in: candidatoIds,
          },
          vaga_id: null,
        },
        select: {
          candidato_id: true,
        },
      });

    const candidatosJaConvidados = new Set<number>(
      convitesExistentes.map((item) => item.candidato_id),
    );

    const candidatosComConvite = candidatos.map((candidato) => ({
      ...candidato,
      ja_convidado: candidatosJaConvidados.has(candidato.candidato_id),
    }));

    return {
      parametros: {
        limite: criterios.limite,
        faixa: criterios.faixa,

        skills: skillsMatch.map((item) => ({
          skill_id: item.skill_id,
          peso: item.peso,
          tipo_skill_id: item.skill.tipo_skill_id,
        })),
      },

      candidatos: candidatosComConvite,
    };
  }

  private async executarMatch({
    recrutadorId,
    linguagem,
    criterios,
  }: {
    recrutadorId: number;
    linguagem: string;
    criterios: CriteriosMatch;
  }) {
    const candidatos = await this.buscarCandidatosBase(linguagem, recrutadorId);

    /*
     * -------------------------------------------------------
     * Elegibilidade
     *
     * Match de vaga:
     * - modalidade
     * - localização
     * - oportunidade / público afirmativo
     *
     * Busca manual:
     * - não aplica esses filtros
     * - busca exclusivamente pelas skills
     * -------------------------------------------------------
     */

    const candidatosElegiveis = candidatos
      .filter((candidato) => {
        if (!criterios.modalidade_codigo) {
          return true;
        }

        return this.isModalidadeCompativel(
          criterios.modalidade_codigo,
          candidato.candidatoModalidadeTrabalhos.map(
            (item) => item.modalidade.codigo,
          ),
        );
      })
      .filter((candidato) => {
        if (!criterios.modalidade_codigo) {
          return true;
        }

        return this.isLocalizacaoCompativel(
          criterios.modalidade_codigo,
          criterios.cidade_id ?? 0,
          candidato.usuario.cidade_id,
        );
      })
      .filter((candidato) => {
        if (!criterios.tipo_oportunidade) {
          return true;
        }

        return this.isPublicoAfirmativoCompativel(
          criterios.tipo_oportunidade,
          criterios.publicos_afirmativos ?? [],
          candidato,
        );
      });

    /*
     * -------------------------------------------------------
     * Score
     * -------------------------------------------------------
     */

    const candidatosComScore = candidatosElegiveis.map((candidato) => {
      const resultadoSkills = this.calcularScoreSkills(
        criterios.skills,
        candidato.skills,
      );

      /*
       * Prioridade afirmativa existe somente
       * quando o match veio de uma oportunidade
       * do tipo AFIRMATIVA.
       *
       * Na busca manual será sempre false.
       */

      const publicoPrioritario =
        criterios.tipo_oportunidade === TipoOportunidade.AFIRMATIVA &&
        this.candidatoPertencePublicoAfirmativo(
          criterios.publicos_afirmativos ?? [],
          candidato,
        );

      return {
        candidato,
        resultadoSkills,
        publicoPrioritario,
      };
    });

    /*
     * -------------------------------------------------------
     * Match mínimo
     * -------------------------------------------------------
     */

    const scoreMinimo = this.MATCH_MINIMO[criterios.faixa];

    const candidatosFiltrados = candidatosComScore.filter(
      (item) => item.resultadoSkills.score >= scoreMinimo,
    );

    /*
     * -------------------------------------------------------
     * Ordenação
     *
     * AFIRMATIVA:
     * público prioritário primeiro e depois score.
     *
     * Demais casos / busca manual:
     * maior score primeiro.
     * -------------------------------------------------------
     */

    const candidatosOrdenados = candidatosFiltrados.sort((a, b) => {
      if (
        criterios.tipo_oportunidade === TipoOportunidade.AFIRMATIVA &&
        a.publicoPrioritario !== b.publicoPrioritario
      ) {
        return Number(b.publicoPrioritario) - Number(a.publicoPrioritario);
      }

      return b.resultadoSkills.score - a.resultadoSkills.score;
    });

    /*
     * -------------------------------------------------------
     * Limite
     * -------------------------------------------------------
     */

    const candidatosLimitados = candidatosOrdenados.slice(0, criterios.limite);

    /*
     * -------------------------------------------------------
     * Retorno
     * -------------------------------------------------------
     */

    return candidatosLimitados.map((item) => {
      const candidato = item.candidato;

      /*
       * Na busca manual não existe oportunidade,
       * portanto não existe incompatibilidade
       * com oportunidade.
       *
       * Mantemos esses campos no retorno para
       * preservar o contrato utilizado pelo
       * CandidateMatchCard.
       */

      const oportunidadeCompativel =
        !criterios.tipo_oportunidade ||
        criterios.tipo_oportunidade !== TipoOportunidade.EXCLUSIVA ||
        this.candidatoPertencePublicoAfirmativo(
          criterios.publicos_afirmativos ?? [],
          candidato,
        );

      return {
        candidato_id: candidato.id,
        nome:
          candidato.usuario.nome_social?.trim() ||
          `${candidato.usuario.primeiro_nome} ${candidato.usuario.ultimo_nome}`.trim(),
        localizacao: candidato.usuario.cidade
          ? `${candidato.usuario.cidade.cidade}/${candidato.usuario.cidade.estado.sigla}`
          : null,
        score: item.resultadoSkills.score,
        hard_skills: item.resultadoSkills.hard_skills,
        soft_skills: item.resultadoSkills.soft_skills,
        publico_prioritario: item.publicoPrioritario,
        modalidade_compativel: true,
        localizacao_compativel: true,
        oportunidade_compativel: oportunidadeCompativel,
        skills_avaliadas: item.resultadoSkills.skills_avaliadas,
        total_skills: item.resultadoSkills.total_skills,
        skills: item.resultadoSkills.detalhes,
      };
    });
  }

  async criarConviteVaga({
    usuarioId,
    dados,
  }: {
    usuarioId: number;
    dados: CriarConviteVagaDto;
  }) {
    const recrutador = await this.buscarRecrutadorPorUsuario(usuarioId);

    const vaga = await this.prisma.empresaVaga.findFirst({
      where: {
        vaga_id: dados.vaga_id,
        empresa_id: dados.empresa_id,
        ativo: true,

        empresa: {
          recrutador_id: recrutador.id,
          ativo: true,
        },
      },
      select: {
        vaga_id: true,
        empresa_id: true,
        nome_vaga: true,
      },
    });

    if (!vaga) {
      throw new BadRequestException(
        'Vaga não encontrada ou não pertence ao recrutador.',
      );
    }

    const candidatoIds = [...new Set(dados.candidato_ids)];

    if (candidatoIds.length !== dados.candidato_ids.length) {
      throw new BadRequestException(
        'Não é permitido informar o mesmo candidato mais de uma vez.',
      );
    }

    if (candidatoIds.length > 10) {
      throw new BadRequestException(
        'É permitido convidar no máximo 10 candidatos por vez.',
      );
    }

    const candidatos = await this.prisma.usuarioPerfilCandidato.findMany({
      where: {
        id: {
          in: candidatoIds,
        },

        ativo: true,
        aberto_oportunidades: true,

        usuario: {
          ativo: true,
        },
      },
      select: {
        id: true,
        usuario_id: true,
        perfil_id: true,
      },
    });

    if (candidatos.length !== candidatoIds.length) {
      throw new BadRequestException(
        'Um ou mais candidatos não foram encontrados ou não estão disponíveis.',
      );
    }

    const convitesExistentes =
      await this.prisma.recrutadorConviteCandidato.findMany({
        where: {
          vaga_id: vaga.vaga_id,
          candidato_id: {
            in: candidatoIds,
          },
        },
        select: {
          candidato_id: true,
        },
      });

    const candidatoIdsJaConvidados = new Set(
      convitesExistentes.map((convite) => convite.candidato_id),
    );

    const candidatoIdsParaConvidar = candidatoIds.filter(
      (candidatoId) => !candidatoIdsJaConvidados.has(candidatoId),
    );

    const titulo = dados.titulo?.trim() || `Convite para ${vaga.nome_vaga}`;

    const mensagem = dados.mensagem?.trim() || '';

    const convites = await this.prisma.$transaction(async (tx) => {
      const registros: {
        id: number;
        candidato_id: number;
        empresa_id: number | null;
        vaga_id: number | null;
        tipo: TipoConviteRecrutador;
        status: StatusConviteRecrutador;
        data_convite: Date;
      }[] = [];

      for (const candidatoId of candidatoIdsParaConvidar) {
        const candidato = candidatos.find((item) => item.id === candidatoId);

        if (!candidato) {
          continue;
        }

        const convite = await tx.recrutadorConviteCandidato.create({
          data: {
            recrutador_id: recrutador.id,
            candidato_id: candidatoId,

            empresa_id: vaga.empresa_id,
            vaga_id: vaga.vaga_id,

            tipo: TipoConviteRecrutador.VAGA,
            status: StatusConviteRecrutador.CONVITE_ENVIADO,

            titulo,
            mensagem,
          },

          select: {
            id: true,
            candidato_id: true,
            empresa_id: true,
            vaga_id: true,
            tipo: true,
            status: true,
            data_convite: true,
          },
        });

        await tx.notificacao.create({
          data: {
            usuario_id: candidato.usuario_id,
            perfil_tipo: PerfilTipo.CANDIDATO,
            perfil_id: candidato.perfil_id,
            referencia_id: convite.id,

            titulo: 'Novo convite para oportunidade',
            mensagem: `Você recebeu um convite para a vaga ${vaga.nome_vaga}.`,

            tipo: TipoNotificacao.NOVO_CONVITE_RECRUTADOR,
          },
        });

        registros.push(convite);
      }

      return registros;
    });

    return {
      total: convites.length,
      ja_convidados: candidatoIdsJaConvidados.size,
      candidatos_ja_convidados: [...candidatoIdsJaConvidados],
      convites,
    };
  }

  async criarConvites(usuarioId: number, dto: CriarConviteManualDto) {
    const recrutador = await this.prisma.usuarioPerfilRecrutador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!recrutador) {
      throw new NotFoundException('Perfil de recrutador não encontrado.');
    }

    /*
     * Remove IDs duplicados caso, por algum motivo,
     * o front envie o mesmo candidato mais de uma vez.
     */
    const candidatoIds = [...new Set(dto.candidato_ids)];

    /*
     * Confirma que todos os candidatos existem
     * e estão ativos.
     */
    const candidatos = await this.prisma.usuarioPerfilCandidato.findMany({
      where: {
        id: {
          in: candidatoIds,
        },
        ativo: true,
      },
      select: {
        id: true,
        usuario_id: true,
        perfil_id: true,
      },
    });

    if (candidatos.length !== candidatoIds.length) {
      throw new BadRequestException(
        'Um ou mais candidatos informados são inválidos.',
      );
    }

    /*
     * Convite da BUSCA MANUAL:
     *
     * empresa_id = null
     * vaga_id    = null
     */
    const convites = await this.prisma.$transaction(async (tx) => {
      const registros = [];

      for (const candidato of candidatos) {
        const convite = await tx.recrutadorConviteCandidato.create({
          data: {
            recrutador_id: recrutador.id,
            candidato_id: candidato.id,

            empresa_id: null,
            vaga_id: null,

            tipo: dto.tipo,
            titulo: dto.titulo,
            mensagem: dto.mensagem,

            status: StatusConviteRecrutador.CONVITE_ENVIADO,
          },
        });

        await tx.notificacao.create({
          data: {
            usuario_id: candidato.usuario_id,
            perfil_tipo: PerfilTipo.CANDIDATO,
            perfil_id: candidato.perfil_id,

            referencia_id: convite.id,

            titulo: 'Novo convite',
            mensagem: `Você recebeu um novo convite: ${dto.titulo}.`,

            tipo: TipoNotificacao.NOVO_CONVITE_RECRUTADOR_MANUAL,
          },
        });

        registros.push(convite);
      }

      return registros;
    });

    return {
      sucesso: true,
      quantidade: convites.length,
      convites: convites.map((convite) => ({
        id: convite.id,
        candidato_id: convite.candidato_id,
      })),
    };
  }

  async buscarConvitesCandidato(usuarioId: number) {
    const candidato = await this.prisma.usuarioPerfilCandidato.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!candidato) {
      throw new NotFoundException('Perfil de candidato não encontrado.');
    }

    return this.prisma.recrutadorConviteCandidato.findMany({
      where: {
        candidato_id: candidato.id,
        status: StatusConviteRecrutador.CONVITE_ENVIADO,
      },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        mensagem: true,
        data_convite: true,

        empresa: {
          select: {
            id: true,
            nome_empresa: true,
          },
        },

        vaga: {
          select: {
            vaga_id: true,
            nome_vaga: true,
            tipo_oportunidade: true,
          },
        },
      },
      orderBy: {
        data_convite: 'desc',
      },
    });
  }

  async responderConviteCandidato({
    usuarioId,
    conviteId,
    resposta,
  }: {
    usuarioId: number;
    conviteId: number;
    resposta: RespostaConviteCandidato;
  }) {
    const candidato = await this.prisma.usuarioPerfilCandidato.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!candidato) {
      throw new NotFoundException('Perfil de candidato não encontrado.');
    }

    const convite = await this.prisma.recrutadorConviteCandidato.findFirst({
      where: {
        id: conviteId,
        candidato_id: candidato.id,
        status: StatusConviteRecrutador.CONVITE_ENVIADO,
      },
      select: {
        id: true,
      },
    });

    if (!convite) {
      throw new NotFoundException(
        'Convite não encontrado ou não está mais disponível.',
      );
    }

    const aceitar = resposta === RespostaConviteCandidato.ACEITAR;

    return this.prisma.recrutadorConviteCandidato.update({
      where: {
        id: convite.id,
      },
      data: aceitar
        ? {
            status: StatusConviteRecrutador.CONVITE_ACEITO,
            data_aceite: new Date(),
          }
        : {
            status: StatusConviteRecrutador.CONVITE_RECUSADO,
            data_recusa: new Date(),
          },
      select: {
        id: true,
        status: true,
        data_aceite: true,
        data_recusa: true,
      },
    });
  }

  async buscarProcessosCandidato(usuarioId: number) {
    const candidato = await this.prisma.usuarioPerfilCandidato.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!candidato) {
      throw new NotFoundException('Perfil de candidato não encontrado.');
    }

    return this.prisma.recrutadorConviteCandidato.findMany({
      where: {
        candidato_id: candidato.id,
        status: {
          in: [
            StatusConviteRecrutador.CONVITE_ACEITO,
            StatusConviteRecrutador.AGENDA_ENVIADA,
            StatusConviteRecrutador.AGENDADO,
            StatusConviteRecrutador.ENTREVISTA_REALIZADA,
          ],
        },
      },

      select: {
        id: true,
        tipo: true,
        titulo: true,
        mensagem: true,
        status: true,
        data_convite: true,
        data_aceite: true,

        empresa: {
          select: {
            id: true,
            nome_empresa: true,
          },
        },

        vaga: {
          select: {
            vaga_id: true,
            nome_vaga: true,
            tipo_oportunidade: true,
          },
        },

        agenda: {
          select: {
            id: true,
            data_hora_agenda: true,
            status: true,
            data_criacao: true,
            data_resposta: true,
          },
        },
      },

      orderBy: {
        data_aceite: 'desc',
      },
    });
  }

  async responderAgendaCandidato({
    usuarioId,
    conviteId,
    resposta,
  }: {
    usuarioId: number;
    conviteId: number;
    resposta: RespostaAgendaCandidato;
  }) {
    const candidato = await this.prisma.usuarioPerfilCandidato.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!candidato) {
      throw new NotFoundException('Perfil de candidato não encontrado.');
    }

    const convite = await this.prisma.recrutadorConviteCandidato.findFirst({
      where: {
        id: conviteId,
        candidato_id: candidato.id,
        status: StatusConviteRecrutador.AGENDA_ENVIADA,
      },
      select: {
        id: true,

        agenda: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!convite) {
      throw new NotFoundException(
        'Processo não encontrado ou não está aguardando resposta de agenda.',
      );
    }

    if (!convite.agenda) {
      throw new BadRequestException(
        'Nenhuma agenda encontrada para este processo.',
      );
    }

    if (convite.agenda.status !== AgendaStatus.PENDENTE) {
      throw new BadRequestException(
        'Esta agenda não está mais aguardando resposta.',
      );
    }

    const aceitar = resposta === RespostaAgendaCandidato.ACEITAR;
    const agora = new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.recrutadorConviteAgenda.update({
        where: {
          id: convite.agenda!.id,
        },
        data: {
          status: aceitar ? AgendaStatus.ACEITO : AgendaStatus.RECUSADO,
          data_resposta: agora,
        },
      });

      return tx.recrutadorConviteCandidato.update({
        where: {
          id: convite.id,
        },
        data: {
          status: aceitar
            ? StatusConviteRecrutador.AGENDADO
            : StatusConviteRecrutador.CONVITE_ACEITO,
        },
        select: {
          id: true,
          status: true,

          agenda: {
            select: {
              id: true,
              data_hora_agenda: true,
              status: true,
              data_resposta: true,
            },
          },
        },
      });
    });
  }

  async buscarFinalizadosCandidato(usuarioId: number) {
    const candidato = await this.prisma.usuarioPerfilCandidato.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!candidato) {
      throw new NotFoundException('Perfil de candidato não encontrado.');
    }

    return this.prisma.recrutadorConviteCandidato.findMany({
      where: {
        candidato_id: candidato.id,
        status: StatusConviteRecrutador.FINALIZADO,
      },

      select: {
        id: true,
        tipo: true,
        titulo: true,
        mensagem: true,
        aprovado: true,
        parecer: true,
        data_convite: true,
        data_aceite: true,
        data_finalizacao: true,

        empresa: {
          select: {
            id: true,
            nome_empresa: true,
          },
        },

        vaga: {
          select: {
            vaga_id: true,
            nome_vaga: true,
            tipo_oportunidade: true,
          },
        },
      },

      orderBy: {
        data_finalizacao: 'desc',
      },
    });
  }
}
