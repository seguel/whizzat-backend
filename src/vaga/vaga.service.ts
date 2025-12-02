import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VagaService {
  constructor(private readonly prisma: PrismaService) {}

  async createVaga(data: {
    empresa_id: number;
    nome_vaga: string;
    descricao: string;
    local_vaga: string;
    modalidade_trabalho_id: number;
    periodo_trabalho_id: number;
    pcd: boolean;
    lgbtq: boolean;
    mulheres: boolean;
    cinquenta_mais: boolean;
    qtde_dias_aberta: number;
    qtde_posicao: number;
    data_cadastro: Date;
    cidade_id: number;
  }) {
    return this.prisma.empresa_vaga.create({
      data,
    });
  }

  async updateVaga(data: {
    vaga_id: number;
    empresa_id: number;
    nome_vaga: string;
    descricao: string;
    local_vaga: string;
    modalidade_trabalho_id: number;
    periodo_trabalho_id: number;
    pcd: boolean;
    lgbtq: boolean;
    mulheres: boolean;
    cinquenta_mais: boolean;
    qtde_dias_aberta: number;
    qtde_posicao: number;
    ativo: boolean;
    cidade_id: number;
  }) {
    return this.prisma.empresa_vaga.update({
      where: {
        vaga_id: data.vaga_id,
        empresa_id: data.empresa_id,
      },
      data: {
        nome_vaga: data.nome_vaga,
        descricao: data.descricao,
        local_vaga: data.local_vaga,
        modalidade_trabalho_id: data.modalidade_trabalho_id,
        periodo_trabalho_id: data.periodo_trabalho_id,
        pcd: data.pcd,
        lgbtq: data.lgbtq,
        mulheres: data.mulheres,
        cinquenta_mais: data.cinquenta_mais,
        qtde_dias_aberta: data.qtde_dias_aberta,
        qtde_posicao: data.qtde_posicao,
        ativo: data.ativo,
        cidade_id: data.cidade_id,
      },
    });
  }

  async createVagaSkills(skills: Prisma.empresa_vaga_skillCreateManyInput[]) {
    return this.prisma.empresa_vaga_skill.createMany({
      data: skills,
    });
  }

  async updateVagaSkills(
    vaga_id: number,
    skills: {
      vaga_id: number;
      skill_id: number;
      peso: number;
      avaliador_proprio: boolean;
    }[],
  ) {
    // Busca skills atuais do vaga
    const existentes = await this.prisma.empresa_vaga_skill.findMany({
      where: { vaga_id },
    });

    const idsExistentes = existentes.map((s) => s.skill_id);
    const idsNovos = skills.map((s) => s.skill_id);

    // 🔹 Remove apenas as skills que não estão mais no novo array
    const paraRemover = idsExistentes.filter((id) => !idsNovos.includes(id));
    if (paraRemover.length > 0) {
      await this.prisma.empresa_vaga_skill.deleteMany({
        where: { vaga_id, skill_id: { in: paraRemover } },
      });
    }

    // 🔹 Atualiza ou cria
    for (const s of skills) {
      const existente = existentes.find((e) => e.skill_id === s.skill_id);
      if (existente) {
        // Atualiza apenas se houve mudança real
        const precisaAtualizar =
          existente.peso !== s.peso ||
          existente.avaliador_proprio !== s.avaliador_proprio;

        if (precisaAtualizar) {
          await this.prisma.empresa_vaga_skill.updateMany({
            where: { vaga_id, skill_id: s.skill_id },
            data: {
              peso: s.peso,
              avaliador_proprio: s.avaliador_proprio,
            },
          });
        }
      } else {
        // Cria nova
        await this.prisma.empresa_vaga_skill.create({ data: s });
      }
    }
  }

  async getVagasRecrutador(
    empresaId: number,
  ): Promise<{ empresa_id: number; vagas: any[] }> {
    const vagas = await this.prisma.empresa_vaga.findMany({
      where: {
        empresa_id: empresaId,
        ativo: true,
        empresa: {
          ativo: true,
        },
      },
      include: {
        modalidade_trabalho: true,
        periodo_trabalho: true,
        skills: {
          select: {
            skill_id: true,
            peso: true,
            avaliador_proprio: true,
            skill: {
              select: {
                skill: true,
                tipo_skill_id: true,
              },
            },
          },
        },
        empresa: {
          select: {
            nome_empresa: true,
            logo: true,
          },
        },
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

    return {
      empresa_id: empresaId,
      vagas, // se não houver nada, retorna []
    };
  }

  async getVaga({
    vaga_id,
    empresa_id,
    lang,
  }: {
    vaga_id: number;
    empresa_id: number;
    lang: string;
  }) {
    const vaga = await this.prisma.empresa_vaga.findFirst({
      where: {
        vaga_id,
        empresa_id,
        empresa: {
          linguagem: lang,
        },
      },
      include: {
        modalidade_trabalho: true,
        periodo_trabalho: true,
        skills: {
          select: {
            skill_id: true,
            peso: true,
            avaliador_proprio: true,
            skill: {
              select: {
                skill: true,
                tipo_skill_id: true,
              },
            },
          },
        },
        empresa: {
          select: {
            nome_empresa: true,
            logo: true,
          },
        },
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

    if (!vaga) return null;

    // 🔹 Calcular prazo
    const prazoDate = new Date(vaga.data_cadastro);
    prazoDate.setDate(prazoDate.getDate() + vaga.qtde_dias_aberta);

    // 🔹 Achatar as skills
    const skills = vaga.skills.map((s) => ({
      skill_id: s.skill_id,
      peso: s.peso,
      avaliador_proprio: s.avaliador_proprio,
      skill: s.skill.skill, // pega direto o texto da skill
      tipo_skill_id: s.skill.tipo_skill_id,
    }));

    return {
      ...vaga,
      prazo: prazoDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      skills,
      cidade_label: vaga.cidade?.cidade ?? null,
      estado_id: vaga.cidade?.estado_id ?? null,
      estado_label: vaga.cidade?.estado?.estado ?? null,
    };
  }

  async getVagasAbertasRecrutador(
    userId: number,
    recrutadorId: number,
    empresaId?: string,
    skill?: string,
  ) {
    // Tipagem segura do where
    const whereEmpresa: Prisma.empresaWhereInput = {
      recrutador_id: recrutadorId,
      ativo: true,
    };

    if (empresaId && empresaId !== 'todos') {
      whereEmpresa.id = Number(empresaId);
    }

    // Consulta
    const empresas = await this.prisma.empresa.findMany({
      where: whereEmpresa,
      select: {
        id: true,
        recrutador_id: true,
        logo: true,
        nome_empresa: true,
        vagas: {
          where: {
            ativo: true,
            ...(skill && skill !== 'todos'
              ? {
                  skills: {
                    some: {
                      skill: {
                        skill: skill, // campo da tabela skill
                      },
                    },
                  },
                }
              : {}),
          },
          select: {
            vaga_id: true,
            nome_vaga: true,
            local_vaga: true,
            pcd: true,
            lgbtq: true,
            mulheres: true,
            cinquenta_mais: true,
            qtde_dias_aberta: true,
            data_cadastro: true,
            cidade_id: true,
            skills: {
              select: {
                skill: {
                  select: {
                    skill: true,
                    tipo_skill_id: true,
                  },
                },
              },
            },
            cidade: {
              select: {
                estado_id: true,
                cidade: true,
                estado: {
                  select: {
                    estado: true,
                    sigla: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const agora = new Date();

    const vagasPlanas = empresas
      .flatMap((empresa) =>
        empresa.vagas
          .filter((vaga) => {
            const prazoDate = new Date(vaga.data_cadastro);
            prazoDate.setDate(prazoDate.getDate() + vaga.qtde_dias_aberta);
            return prazoDate >= agora; // mantém apenas as vagas válidas
          })
          .map((vaga) => {
            const prazoDate = new Date(vaga.data_cadastro);
            prazoDate.setDate(prazoDate.getDate() + vaga.qtde_dias_aberta);

            return {
              empresa_id: empresa.id,
              recrutador_id: empresa.recrutador_id,
              logo: empresa.logo,
              nome_empresa: empresa.nome_empresa,
              vaga_id: vaga.vaga_id,
              nome_vaga: vaga.nome_vaga,
              localizacao: vaga.local_vaga,
              data_cadastro: vaga.data_cadastro,
              qtde_dias_aberta: vaga.qtde_dias_aberta,
              prazo: prazoDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              }),
              prazo_timestamp: prazoDate.getTime(), // adiciona para facilitar ordenação
              pcd: vaga.pcd,
              lgbtq: vaga.lgbtq,
              mulheres: vaga.mulheres,
              cinquenta_mais: vaga.cinquenta_mais,
              skills: vaga.skills.map((s) => s.skill.skill),
              cidade_label: vaga.cidade.cidade,
              cidade_id: vaga.cidade_id,
              estado_id: vaga.cidade.estado_id,
              estado_label: vaga.cidade.estado,
              estado_sigla: vaga.cidade.estado.sigla,
            };
          }),
      )
      // ordena globalmente: vencimento mais próximo primeiro
      .sort((a, b) => a.prazo_timestamp - b.prazo_timestamp);

    return vagasPlanas;
  }

  async getVagas(lang: string, modalidadeId?: string, skill?: string) {
    // Tipagem segura do where
    const whereEmpresa: Prisma.empresaWhereInput = {
      linguagem: lang,
      ativo: true,
    };

    // Consulta
    const empresas = await this.prisma.empresa.findMany({
      where: whereEmpresa,
      select: {
        id: true,
        logo: true,
        nome_empresa: true,
        vagas: {
          where: {
            ativo: true,
            ...(modalidadeId && modalidadeId !== 'todos'
              ? { modalidade_trabalho_id: Number(modalidadeId) }
              : {}),
            ...(skill && skill !== 'todos'
              ? {
                  skills: {
                    some: {
                      skill: {
                        skill: skill, // campo da tabela skill
                      },
                    },
                  },
                }
              : {}),
          },
          select: {
            vaga_id: true,
            nome_vaga: true,
            local_vaga: true,
            pcd: true,
            lgbtq: true,
            mulheres: true,
            cinquenta_mais: true,
            qtde_dias_aberta: true,
            data_cadastro: true,
            cidade_id: true,
            skills: {
              select: {
                skill: {
                  select: {
                    skill: true,
                    tipo_skill_id: true,
                  },
                },
              },
            },
            cidade: {
              select: {
                estado_id: true,
                cidade: true,
                estado: {
                  select: {
                    estado: true,
                    sigla: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const agora = new Date();

    const vagasPlanas = empresas
      .flatMap((empresa) =>
        empresa.vagas
          .filter((vaga) => {
            const prazoDate = new Date(vaga.data_cadastro);
            prazoDate.setDate(prazoDate.getDate() + vaga.qtde_dias_aberta);
            return prazoDate >= agora; // mantém apenas as vagas válidas
          })
          .map((vaga) => {
            const prazoDate = new Date(vaga.data_cadastro);
            prazoDate.setDate(prazoDate.getDate() + vaga.qtde_dias_aberta);

            return {
              empresa_id: empresa.id,
              logo: empresa.logo,
              nome_empresa: empresa.nome_empresa,
              vaga_id: vaga.vaga_id,
              nome_vaga: vaga.nome_vaga,
              localizacao: vaga.local_vaga,
              data_cadastro: vaga.data_cadastro,
              qtde_dias_aberta: vaga.qtde_dias_aberta,
              prazo: prazoDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              }),
              prazo_timestamp: prazoDate.getTime(), // adiciona para facilitar ordenação
              pcd: vaga.pcd,
              lgbtq: vaga.lgbtq,
              mulheres: vaga.mulheres,
              cinquenta_mais: vaga.cinquenta_mais,
              skills: vaga.skills.map((s) => s.skill.skill),
              cidade_label: vaga.cidade.cidade,
              cidade_id: vaga.cidade_id,
              estado_id: vaga.cidade.estado_id,
              estado_label: vaga.cidade.estado,
              estado_sigla: vaga.cidade.estado.sigla,
            };
          }),
      )
      // ordena globalmente: vencimento mais próximo primeiro
      .sort((a, b) => a.prazo_timestamp - b.prazo_timestamp);

    return vagasPlanas;
  }
}
