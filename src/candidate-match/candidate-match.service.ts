import { PublicoAfirmativo, TipoOportunidade } from '@prisma/client';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { FaixaMatch } from './dto/buscar-candidatos-vaga.dto';

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
    await this.validarAcessoRecrutador(usuarioId, empresaId);

    const vaga = await this.buscarVagaParaMatch(vagaId, empresaId);

    this.validarPrazoVaga(vaga.data_cadastro, vaga.qtde_dias_aberta);

    const candidatos = await this.buscarCandidatosBase(vaga.empresa.linguagem);

    const candidatosElegiveis = candidatos
      .filter((candidato) =>
        this.isModalidadeCompativel(
          vaga.modalidade_trabalho.codigo,
          candidato.candidatoModalidadeTrabalhos.map(
            (item) => item.modalidade.codigo,
          ),
        ),
      )
      .filter((candidato) =>
        this.isLocalizacaoCompativel(
          vaga.modalidade_trabalho.codigo,
          vaga.cidade_id,
          candidato.usuario.cidade_id,
        ),
      )
      .filter((candidato) =>
        this.isPublicoAfirmativoCompativel(
          vaga.tipo_oportunidade,
          vaga.publicos_afirmativos.map((item) => item.codigo),
          candidato,
        ),
      );

    const candidatosComScore = candidatosElegiveis.map((candidato) => {
      const resultadoSkills = this.calcularScoreSkills(
        vaga.skills,
        candidato.skills,
      );

      const publicoPrioritario =
        vaga.tipo_oportunidade === TipoOportunidade.AFIRMATIVA &&
        this.candidatoPertencePublicoAfirmativo(
          vaga.publicos_afirmativos.map((item) => item.codigo),
          candidato,
        );

      return {
        candidato,
        resultadoSkills,
        publicoPrioritario,
      };
    });

    const scoreMinimo = this.MATCH_MINIMO[faixa];

    const candidatosFiltrados = candidatosComScore.filter(
      (item) => item.resultadoSkills.score >= scoreMinimo,
    );

    const candidatosOrdenados = candidatosFiltrados.sort((a, b) => {
      /*
       * Em vaga AFIRMATIVA, candidatos pertencentes ao público
       * aparecem primeiro.
       */
      if (
        vaga.tipo_oportunidade === TipoOportunidade.AFIRMATIVA &&
        a.publicoPrioritario !== b.publicoPrioritario
      ) {
        return Number(b.publicoPrioritario) - Number(a.publicoPrioritario);
      }

      return b.resultadoSkills.score - a.resultadoSkills.score;
    });

    const candidatosLimitados = candidatosOrdenados.slice(0, limite);

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

      candidatos: candidatosLimitados.map((item) => {
        const candidato = item.candidato;

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

          oportunidade_compativel:
            vaga.tipo_oportunidade !== TipoOportunidade.EXCLUSIVA ||
            this.candidatoPertencePublicoAfirmativo(
              vaga.publicos_afirmativos.map((publico) => publico.codigo),
              candidato,
            ),

          skills_avaliadas: item.resultadoSkills.skills_avaliadas,

          total_skills: item.resultadoSkills.total_skills,

          skills: item.resultadoSkills.detalhes,
        };
      }),
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

  private async buscarCandidatosBase(lang: string) {
    return this.prisma.usuarioPerfilCandidato.findMany({
      where: {
        ativo: true,
        aberto_oportunidades: true,
        linguagem: lang,

        usuario: {
          ativo: true,
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
}
