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
    // Remove todas as skills antigas
    await this.prisma.empresa_vaga_skill.deleteMany({
      where: { vaga_id },
    });

    // Insere as novas
    if (skills.length > 0) {
      await this.prisma.empresa_vaga_skill.createMany({
        data: skills,
      });
    }
  }

  async getVagas(
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
  }: {
    vaga_id: number;
    empresa_id: number;
  }) {
    const vaga = await this.prisma.empresa_vaga.findFirst({
      where: {
        vaga_id,
        empresa_id,
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
    }));

    return {
      ...vaga,
      prazo: prazoDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      skills,
    };
  }

  async getVagasAbertas(
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
            skills: {
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
            };
          }),
      )
      // ordena globalmente: vencimento mais próximo primeiro
      .sort((a, b) => a.prazo_timestamp - b.prazo_timestamp);

    return vagasPlanas;
  }
}
