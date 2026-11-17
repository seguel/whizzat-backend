import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SalvarDiscRespostaDto } from './dto/salvar-disc-resposta.dto';
import { calcularDisc } from './disc-calculo';

@Injectable()
export class DiscService {
  constructor(private readonly prisma: PrismaService) {}

  private async buscarCandidato(usuarioId: number) {
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
      throw new ForbiddenException('Perfil de candidato não encontrado.');
    }

    return candidato;
  }

  private async questionarioAtivo() {
    const questionario = await this.prisma.discQuestionario.findFirst({
      where: {
        ativo: true,
        linguagem: 'pt-BR',
      },
      orderBy: {
        versao: 'desc',
      },
    });

    if (!questionario) {
      throw new NotFoundException('Questionário DISC não encontrado.');
    }

    return questionario;
  }

  async buscarQuestionario() {
    const questionario = await this.questionarioAtivo();

    return this.prisma.discQuestionario.findUnique({
      where: {
        id: questionario.id,
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        versao: true,
        perguntas: {
          where: { ativo: true },
          orderBy: { numero_bloco: 'asc' },
          select: {
            id: true,
            numero_bloco: true,
            alternativas: {
              where: { ativo: true },
              orderBy: { letra: 'asc' },
              select: {
                id: true,
                letra: true,
                texto: true,
              },
            },
          },
        },
      },
    });
  }

  async buscarMinhaAplicacao(usuarioId: number) {
    const candidato = await this.buscarCandidato(usuarioId);

    return this.prisma.candidatoDiscAplicacao.findFirst({
      where: {
        candidato_id: candidato.id,
        status: 'EM_ANDAMENTO',
      },
      orderBy: {
        iniciado_em: 'desc',
      },
      include: {
        respostas: {
          orderBy: {
            pergunta: {
              numero_bloco: 'asc',
            },
          },
        },
      },
    });
  }

  async iniciar(usuarioId: number, consentimento: boolean) {
    if (consentimento !== true) {
      throw new BadRequestException(
        'É necessário aceitar a participação no DISC.',
      );
    }

    const candidato = await this.buscarCandidato(usuarioId);

    const concluida = await this.prisma.candidatoDiscAplicacao.findFirst({
      where: {
        candidato_id: candidato.id,
        status: 'CONCLUIDO',
      },
      select: {
        id: true,
      },
    });

    if (concluida) {
      throw new BadRequestException(
        'O questionário DISC já foi concluído e não pode ser respondido novamente.',
      );
    }

    const existente = await this.buscarMinhaAplicacao(usuarioId);

    if (existente) {
      return existente;
    }

    const questionario = await this.questionarioAtivo();

    return this.prisma.candidatoDiscAplicacao.create({
      data: {
        candidato_id: candidato.id,
        questionario_id: questionario.id,
        status: 'EM_ANDAMENTO',
        consentimento: true,
        consentimento_em: new Date(),
        compartilhar_recrutador: false,
      },
    });
  }

  async salvarResposta(
    usuarioId: number,
    aplicacaoId: number,
    body: SalvarDiscRespostaDto,
  ) {
    const candidato = await this.buscarCandidato(usuarioId);

    const aplicacao = await this.prisma.candidatoDiscAplicacao.findFirst({
      where: {
        id: aplicacaoId,
        candidato_id: candidato.id,
        status: 'EM_ANDAMENTO',
      },
    });

    if (!aplicacao) {
      throw new NotFoundException(
        'Aplicação DISC em andamento não encontrada.',
      );
    }

    if (body.alternativa_mais_id === body.alternativa_menos_id) {
      throw new BadRequestException(
        'As alternativas Mais e Menos devem ser diferentes.',
      );
    }

    const pergunta = await this.prisma.discPergunta.findFirst({
      where: {
        id: body.pergunta_id,
        questionario_id: aplicacao.questionario_id,
        ativo: true,
      },
      include: {
        alternativas: {
          where: {
            ativo: true,
          },
        },
      },
    });

    if (!pergunta) {
      throw new BadRequestException('Pergunta inválida para esta aplicação.');
    }

    const idsValidos = new Set(
      pergunta.alternativas.map((alternativa) => alternativa.id),
    );

    if (
      !idsValidos.has(body.alternativa_mais_id) ||
      !idsValidos.has(body.alternativa_menos_id)
    ) {
      throw new BadRequestException(
        'As alternativas não pertencem à pergunta informada.',
      );
    }

    const respostaExistente =
      await this.prisma.candidatoDiscResposta.findUnique({
        where: {
          aplicacao_id_pergunta_id: {
            aplicacao_id: aplicacaoId,
            pergunta_id: body.pergunta_id,
          },
        },
        select: {
          tempo_ms: true,
        },
      });

    return this.prisma.candidatoDiscResposta.upsert({
      where: {
        aplicacao_id_pergunta_id: {
          aplicacao_id: aplicacaoId,
          pergunta_id: body.pergunta_id,
        },
      },
      create: {
        aplicacao_id: aplicacaoId,
        pergunta_id: body.pergunta_id,
        alternativa_mais_id: body.alternativa_mais_id,
        alternativa_menos_id: body.alternativa_menos_id,
        tempo_ms: body.tempo_ms,
      },
      update: {
        alternativa_mais_id: body.alternativa_mais_id,
        alternativa_menos_id: body.alternativa_menos_id,
        tempo_ms: Math.max(respostaExistente?.tempo_ms ?? 0, body.tempo_ms),
      },
    });
  }

  async finalizar(usuarioId: number, aplicacaoId: number) {
    const candidato = await this.buscarCandidato(usuarioId);

    return this.prisma.$transaction(async (tx) => {
      const aplicacao = await tx.candidatoDiscAplicacao.findFirst({
        where: {
          id: aplicacaoId,
          candidato_id: candidato.id,
          status: 'EM_ANDAMENTO',
          consentimento: true,
        },
        include: {
          respostas: {
            include: {
              pergunta: {
                select: {
                  id: true,
                  numero_bloco: true,
                  questionario_id: true,
                },
              },
              alternativa_mais: {
                select: {
                  id: true,
                  pergunta_id: true,
                  dimensao: true,
                },
              },
              alternativa_menos: {
                select: {
                  id: true,
                  pergunta_id: true,
                  dimensao: true,
                },
              },
            },
          },
        },
      });

      if (!aplicacao) {
        throw new NotFoundException(
          'Aplicação DISC em andamento não encontrada.',
        );
      }

      const perguntas = await tx.discPergunta.findMany({
        where: {
          questionario_id: aplicacao.questionario_id,
          ativo: true,
        },
        select: {
          id: true,
        },
      });

      if (perguntas.length !== 24) {
        throw new BadRequestException(
          'O questionário DISC deve conter 24 blocos ativos.',
        );
      }

      const idsPerguntas = new Set(perguntas.map((p) => p.id));

      const respostasValidas = aplicacao.respostas.filter(
        (resposta) =>
          idsPerguntas.has(resposta.pergunta_id) &&
          resposta.pergunta.questionario_id === aplicacao.questionario_id &&
          resposta.alternativa_mais_id !== resposta.alternativa_menos_id &&
          resposta.alternativa_mais.pergunta_id === resposta.pergunta_id &&
          resposta.alternativa_menos.pergunta_id === resposta.pergunta_id,
      );

      if (respostasValidas.length !== 24) {
        throw new BadRequestException(
          `Questionário incompleto: ${respostasValidas.length} de 24 blocos respondidos.`,
        );
      }

      const resultado = calcularDisc(respostasValidas);

      // Reserva a finalização: evita que duas chamadas
      // concluam a mesma aplicação.
      const reserva = await tx.candidatoDiscAplicacao.updateMany({
        where: {
          id: aplicacaoId,
          candidato_id: candidato.id,
          status: 'EM_ANDAMENTO',
        },
        data: {
          status: 'CONCLUIDO',
        },
      });

      if (reserva.count !== 1) {
        throw new BadRequestException('Esta aplicação já foi finalizada.');
      }

      const atualizada = await tx.candidatoDiscAplicacao.update({
        where: {
          id: aplicacaoId,
        },
        data: {
          finalizado_em: new Date(),

          score_d: resultado.scores.D,
          score_i: resultado.scores.I,
          score_s: resultado.scores.S,
          score_c: resultado.scores.C,

          dimensao_dominante: resultado.dominante,
          dimensao_secundaria: resultado.secundaria,

          blend_codigo: resultado.blendCodigo,
          blend_titulo: resultado.blendTitulo,

          tempo_total_ms: resultado.tempoTotal,
          tempo_medio_ms: resultado.tempoMedio,

          bloco_mais_rapido: resultado.blocoMaisRapido,
          bloco_mais_lento: resultado.blocoMaisLento,

          // O campo atual tem limite de 50 caracteres.
          // Guardamos o alerta principal; os demais
          // podem ser recalculados pelos tempos persistidos.
          alerta_tempo: resultado.alertas[0] ?? 'RITMO_PADRAO',

          algoritmo_versao: 1,
        },
      });

      return {
        id: atualizada.id,
        status: atualizada.status,
        finalizado_em: atualizada.finalizado_em,
        resultado: {
          scores: resultado.scores,
          dominante: resultado.dominante,
          secundaria: resultado.secundaria,
          blend_codigo: resultado.blendCodigo,
          blend_titulo: resultado.blendTitulo,
          tempo_total_ms: resultado.tempoTotal,
          tempo_medio_ms: resultado.tempoMedio,
          bloco_mais_rapido: resultado.blocoMaisRapido,
          bloco_mais_lento: resultado.blocoMaisLento,
          alertas: resultado.alertas,
        },
      };
    });
  }

  async buscarMeuResultado(usuarioId: number) {
    const candidato = await this.buscarCandidato(usuarioId);

    const aplicacao = await this.prisma.candidatoDiscAplicacao.findFirst({
      where: {
        candidato_id: candidato.id,
        status: 'CONCLUIDO',
      },
      orderBy: {
        finalizado_em: 'desc',
      },
      select: {
        id: true,
        status: true,
        iniciado_em: true,
        finalizado_em: true,

        score_d: true,
        score_i: true,
        score_s: true,
        score_c: true,

        dimensao_dominante: true,
        dimensao_secundaria: true,

        blend_codigo: true,
        blend_titulo: true,

        tempo_total_ms: true,
        tempo_medio_ms: true,
        bloco_mais_rapido: true,
        bloco_mais_lento: true,
        alerta_tempo: true,

        compartilhar_recrutador: true,
      },
    });

    if (!aplicacao) {
      return {
        possui_resultado: false,
        resultado: null,
      };
    }

    return {
      possui_resultado: true,
      resultado: {
        id: aplicacao.id,
        status: aplicacao.status,
        iniciado_em: aplicacao.iniciado_em,
        finalizado_em: aplicacao.finalizado_em,

        scores: {
          D: aplicacao.score_d,
          I: aplicacao.score_i,
          S: aplicacao.score_s,
          C: aplicacao.score_c,
        },

        dominante: aplicacao.dimensao_dominante,
        secundaria: aplicacao.dimensao_secundaria,

        blend_codigo: aplicacao.blend_codigo,
        blend_titulo: aplicacao.blend_titulo,

        tempo_total_ms: aplicacao.tempo_total_ms,
        tempo_medio_ms: aplicacao.tempo_medio_ms,

        bloco_mais_rapido: aplicacao.bloco_mais_rapido,
        bloco_mais_lento: aplicacao.bloco_mais_lento,

        alerta_tempo: aplicacao.alerta_tempo,
        compartilhar_recrutador: aplicacao.compartilhar_recrutador,
      },
    };
  }

  async atualizarCompartilhamento(usuarioId: number, compartilhar: boolean) {
    const candidato = await this.prisma.usuarioPerfilCandidato.findFirst({
      where: {
        usuario_id: usuarioId,
      },
      select: {
        id: true,
      },
    });

    if (!candidato) {
      throw new NotFoundException('Perfil de candidato não encontrado.');
    }

    const aplicacao = await this.prisma.candidatoDiscAplicacao.findFirst({
      where: {
        candidato_id: candidato.id,
        status: 'CONCLUIDO',
      },
      orderBy: {
        finalizado_em: 'desc',
      },
      select: {
        id: true,
      },
    });

    if (!aplicacao) {
      throw new NotFoundException(
        'Nenhuma avaliação DISC concluída foi encontrada.',
      );
    }

    const atualizada = await this.prisma.candidatoDiscAplicacao.update({
      where: {
        id: aplicacao.id,
      },
      data: {
        compartilhar_recrutador: compartilhar,
      },
      select: {
        id: true,
        compartilhar_recrutador: true,
      },
    });

    return {
      sucesso: true,
      compartilhar_recrutador: atualizada.compartilhar_recrutador,
    };
  }
}
