import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionarioDto } from './dto/create-questionario.dto';
import { UpdateQuestionarioDto } from './dto/update-questionario.dto';

@Injectable()
export class QuestionarioService {
  constructor(private prisma: PrismaService) {}

  async create(usuarioId: number, body: CreateQuestionarioDto) {
    const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
    });

    if (!avaliador) {
      throw new Error('Avaliador não encontrado');
    }

    const existe = await this.prisma.avaliadorQuestionario.findFirst({
      where: {
        avaliador_id: avaliador.id,
        titulo: body.titulo,
        // NOT: { id },
      },
    });

    if (existe) {
      throw new Error('Já existe um questionário com esse título');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const questionario = await tx.avaliadorQuestionario.create({
        data: {
          avaliador_id: avaliador.id,
          titulo: body.titulo,
          comentario: body.comentario ?? '',
          ativo: body.ativo,
        },
      });

      const perguntas = body.perguntas.map((p) => ({
        questionario_id: questionario.id,
        pergunta: p.pergunta,
        resposta_base: p.resposta_base,
        ordem: p.ordem,
      }));

      await tx.avaliadorQuestionarioPergunta.createMany({
        data: perguntas,
      });

      return questionario;
    });

    return result;
  }

  async list(usuarioId: number) {
    const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
    });

    const questionarios = await this.prisma.avaliadorQuestionario.findMany({
      where: {
        avaliador_id: avaliador?.id,
      },
      orderBy: [
        {
          ativo: 'desc', // ativos primeiro
        },
        {
          data_criacao: 'desc', // mais novos primeiro
        },
      ],
      include: {
        _count: {
          select: {
            pergunta: {
              where: {
                ativo: true,
              },
            },
          },
        },
      },
    });

    return questionarios.map((q) => ({
      id: q.id,
      titulo: q.titulo,
      comentario: q.comentario,
      ativo: q.ativo,
      data_criacao: q.data_criacao,
      total_perguntas: q._count.pergunta,
    }));
  }

  async get(id: number, usuarioId: number) {
    const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
    });

    return this.prisma.avaliadorQuestionario.findFirst({
      where: {
        id,
        avaliador_id: avaliador?.id,
      },
      include: {
        pergunta: {
          orderBy: {
            ordem: 'asc',
          },
        },
      },
    });
  }

  async update(id: number, usuarioId: number, body: UpdateQuestionarioDto) {
    const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
    });

    if (!avaliador) {
      throw new Error('Avaliador não encontrado');
    }

    const questionario = await this.prisma.avaliadorQuestionario.findFirst({
      where: {
        id,
        avaliador_id: avaliador.id,
      },
    });

    if (!questionario) {
      throw new Error('Questionário não encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.avaliadorQuestionario.update({
        where: { id },
        data: {
          titulo: body.titulo,
          comentario: body.comentario ?? '',
          ativo: body.ativo,
        },
      });

      if (body.perguntas) {
        const questionarioEmUso = await tx.avaliadorAvaliacaoSkill.findFirst({
          where: {
            questionario_id: id,
          },
          select: { id: true },
        });

        const existentes = await tx.avaliadorQuestionarioPergunta.findMany({
          where: { questionario_id: id },
          select: { id: true },
        });

        const idsPayload = body.perguntas
          .filter((p) => typeof p.id === 'number')
          .map((p) => p.id);

        const remover = existentes
          .filter((p) => !idsPayload.includes(p.id))
          .map((p) => p.id);

        if (remover.length) {
          if (questionarioEmUso) {
            // apenas inativa
            await tx.avaliadorQuestionarioPergunta.updateMany({
              where: {
                id: { in: remover },
              },
              data: { ativo: false },
            });
          } else {
            // pode deletar
            await tx.avaliadorQuestionarioPergunta.deleteMany({
              where: {
                id: { in: remover },
              },
            });
          }
        }

        for (const p of body.perguntas) {
          if (p.id) {
            await tx.avaliadorQuestionarioPergunta.update({
              where: { id: p.id },
              data: {
                pergunta: p.pergunta,
                resposta_base: p.resposta_base,
                ativo: p.ativo,
                ordem: p.ordem,
              },
            });
          } else {
            await tx.avaliadorQuestionarioPergunta.create({
              data: {
                questionario_id: id,
                pergunta: p.pergunta,
                resposta_base: p.resposta_base,
                ativo: p.ativo,
                ordem: p.ordem,
              },
            });
          }
        }
      }
    });
  }

  async delete(id: number, usuarioId: number) {
    const avaliador = await this.prisma.usuarioPerfilAvaliador.findFirst({
      where: {
        usuario_id: usuarioId,
        ativo: true,
      },
    });

    if (!avaliador) {
      throw new Error('Avaliador não encontrado');
    }

    const questionario = await this.prisma.avaliadorQuestionario.findFirst({
      where: {
        id,
        avaliador_id: avaliador.id,
      },
    });

    if (!questionario) {
      throw new Error('Questionário não encontrado');
    }

    // verifica se já foi utilizado
    const emUso = await this.prisma.avaliadorAvaliacaoSkill.count({
      where: {
        questionario_id: id,
      },
    });

    if (emUso > 0) {
      throw new Error(
        'Este questionário já foi utilizado. Caso não queira mais usá-lo, inative-o.',
      );
    }

    return this.prisma.avaliadorQuestionario.delete({
      where: {
        id,
      },
    });
  }
}
