import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type Item = readonly [string, DiscDimensao];
type Bloco = readonly [Item, Item, Item, Item];

// Conteúdo literal do DISC.pdf, seção 3. Não exibir as dimensões no frontend.
const blocos: readonly Bloco[] = [
  [
    ['Assumo a liderança e tomo decisões rapidamente', 'D'],
    ['Gosto de me expressar e animar as pessoas', 'I'],
    ['Prefiro ambientes previsíveis e tranquilos', 'S'],
    ['Analiso os fatos antes de agir', 'C'],
  ],
  [
    ['Sigo regras e procedimentos com rigor', 'C'],
    ['Enfrento conflitos de frente para resolver o problema', 'D'],
    ['Faço amizades com facilidade', 'I'],
    ['Escuto com calma antes de dar minha opinião', 'S'],
  ],
  [
    ['Sou leal e consistente no que faço', 'S'],
    ['Organizo meu trabalho com método e detalhe', 'C'],
    ['Busco desafios grandes e resultados imediatos', 'D'],
    ['Consigo persuadir e envolver pessoas', 'I'],
  ],
  [
    ['Sou otimista e vejo o lado bom das situações', 'I'],
    ['Evito mudanças bruscas e prefiro gradualidade', 'S'],
    ['Verifico tudo duas vezes antes de entregar', 'C'],
    ['Sou direto e vou direto ao ponto', 'D'],
  ],
  [
    ['Tomo o controle quando a situação fica confusa', 'D'],
    ['Gosto de dados e informações precisas', 'C'],
    ['Gosto de trabalhar em equipe e socializar', 'I'],
    ['Mantenho a calma mesmo sob pressão', 'S'],
  ],
  [
    ['Prefiro cooperar a competir', 'S'],
    ['Assumo riscos calculados para vencer', 'D'],
    ['Questiono e testo antes de aceitar conclusões', 'C'],
    ['Falo com energia e entusiasmo', 'I'],
  ],
  [
    ['Defendo minha posição com firmeza', 'D'],
    ['Inicio conversas e aproximo as pessoas', 'I'],
    ['Dou tempo para as coisas acontecerem', 'S'],
    ['Prefiro instruções claras e definidas', 'C'],
  ],
  [
    ['Corrijo erros com precisão', 'C'],
    ['Decido sozinho quando necessário', 'D'],
    ['Comunico ideias com paixão', 'I'],
    ['Aceito bem rotinas e repetições', 'S'],
  ],
  [
    ['Evito confrontos sempre que possível', 'S'],
    ['Exijo qualidade e exatidão', 'C'],
    ['Gosto de vencer e ser reconhecido por resultados', 'D'],
    ['Diverto-me em ambientes movimentados', 'I'],
  ],
  [
    ['Sou simpático e acessível', 'I'],
    ['Trabalho bem com prazos longos e estáveis', 'S'],
    ['Sigo padrões e normas estabelecidas', 'C'],
    ['Vou direto ao resultado sem rodeios', 'D'],
  ],
  [
    ['Assumo riscos que outros evitam', 'D'],
    ['Confiro detalhes antes de finalizar', 'C'],
    ['Conto histórias e cativo o público', 'I'],
    ['Sou paciente com o ritmo dos outros', 'S'],
  ],
  [
    ['Mantenho a estabilidade do grupo', 'S'],
    ['Tomo decisões difíceis sem hesitar', 'D'],
    ['Documento e registro tudo com cuidado', 'C'],
    ['Motivo as pessoas com meu entusiasmo', 'I'],
  ],
  [
    ['Competitivo e focado em metas', 'D'],
    ['Espontâneo e expressivo', 'I'],
    ['Modesto e discreto', 'S'],
    ['Cauteloso e preventivo', 'C'],
  ],
  [
    ['Sou metódico e sistemático', 'C'],
    ['Imponho minhas ideias com convicção', 'D'],
    ['Sou comunicativo e falo fácil', 'I'],
    ['Prefiro harmonia a disputas', 'S'],
  ],
  [
    ['Me adapto sem reclamar', 'S'],
    ['Analiso riscos antes de decidir', 'C'],
    ['Acelero o ritmo quando preciso', 'D'],
    ['Crio conexões rapidamente', 'I'],
  ],
  [
    ['Sorrio e mantenho o ambiente leve', 'I'],
    ['Sou constante e confiável', 'S'],
    ['Sou crítico e exigente com qualidade', 'C'],
    ['Exijo muito de mim e dos outros', 'D'],
  ],
  [
    ['Assumo o comando em crises', 'D'],
    ['Busco dados antes de concluir', 'C'],
    ['Sou bem-humorado e otimista', 'I'],
    ['Sou bom ouvinte', 'S'],
  ],
  [
    ['Conquisto espaço pela confiabilidade', 'S'],
    ['Conquisto espaço pela força de resultados', 'D'],
    ['Conquisto espaço pela competência técnica', 'C'],
    ['Conquisto espaço pelo carisma', 'I'],
  ],
  [
    ['Prefiro comandar a ser comandado', 'D'],
    ['Prefiro ambientes com muitas pessoas', 'I'],
    ['Prefiro poucas mudanças', 'S'],
    ['Prefiro trabalho que exija precisão', 'C'],
  ],
  [
    ['Procuro a causa raiz dos problemas', 'C'],
    ['Enfrento problemas de frente', 'D'],
    ['Vejo oportunidades onde outros veem problemas', 'I'],
    ['Aceito o que não posso mudar', 'S'],
  ],
  [
    ['Sou compreensivo e empático', 'S'],
    ['Sou objetivo e lógico', 'C'],
    ['Sou determinado e persistente', 'D'],
    ['Sou persuasivo e convincente', 'I'],
  ],
  [
    ['Faço acontecer com energia e comunicação', 'I'],
    ['Faço acontecer com consistência', 'S'],
    ['Faço acontecer com precisão', 'C'],
    ['Faço acontecer', 'D'],
  ],
  [
    ['Gosto de autonomia e autoridade', 'D'],
    ['Gosto de regras claras e padrões', 'C'],
    ['Gosto de visibilidade e contato com pessoas', 'I'],
    ['Gosto de segurança e previsibilidade', 'S'],
  ],
  [
    ['Estabilidade e segurança me motivam', 'S'],
    ['Resultados rápidos me motivam', 'D'],
    ['Exatidão e qualidade me motivam', 'C'],
    ['Reconhecimento social me motiva', 'I'],
  ],
];

export async function seedDisc() {
  if (blocos.length !== 24 || blocos.some((b) => b.length !== 4)) {
    throw new Error('O DISC precisa ter 24 blocos com 4 alternativas cada.');
  }

  for (const [indice, bloco] of blocos.entries()) {
    const dimensoes = bloco.map(([, dimensao]) => dimensao);
    if (new Set(dimensoes).size !== 4) {
      throw new Error(`Dimensões repetidas no bloco ${indice + 1}.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    const questionario = await tx.discQuestionario.upsert({
      where: { versao_linguagem: { versao: 1, linguagem: 'pt-BR' } },
      create: {
        titulo: 'Mapeamento Comportamental DISC',
        descricao:
          'Questionário de escolha forçada com 24 blocos e quatro afirmações por bloco.',
        versao: 1,
        linguagem: 'pt-BR',
        ativo: true,
      },
      update: {},
    });

    // Nunca alterar conteúdo de uma versão já utilizada em aplicações.
    const aplicacoes = await tx.candidatoDiscAplicacao.count({
      where: { questionario_id: questionario.id },
    });

    const perguntasExistentes = await tx.discPergunta.findMany({
      where: { questionario_id: questionario.id },
      include: { alternativas: true },
    });

    if (aplicacoes > 0) {
      if (
        perguntasExistentes.length !== 24 ||
        perguntasExistentes.some((p) => p.alternativas.length !== 4)
      ) {
        throw new Error(
          'Questionário em uso com banco de itens incompleto. Crie uma nova versão para corrigir.',
        );
      }
      // Verifica conteúdo e dimensões sem modificá-los.
      for (const [index, bloco] of blocos.entries()) {
        const p = perguntasExistentes.find((p) => p.numero_bloco === index + 1);
        if (
          !p ||
          bloco.some(([texto, dimensao], i) => {
            const a = p.alternativas.find((a) => a.letra === 'abcd'[i]);
            return (
              !a || a.texto !== texto || a.dimensao !== dimensao || a.peso !== 1
            );
          })
        ) {
          throw new Error(
            `Versão 1 em uso diverge do seed no bloco ${index + 1}.`,
          );
        }
      }
      return;
    }

    for (const [indice, bloco] of blocos.entries()) {
      const pergunta = await tx.discPergunta.upsert({
        where: {
          questionario_id_numero_bloco: {
            questionario_id: questionario.id,
            numero_bloco: indice + 1,
          },
        },
        create: {
          questionario_id: questionario.id,
          numero_bloco: indice + 1,
          ativo: true,
        },
        update: {},
      });

      for (const [i, [texto, dimensao]] of bloco.entries()) {
        await tx.discAlternativa.upsert({
          where: {
            pergunta_id_letra: {
              pergunta_id: pergunta.id,
              letra: 'abcd'[i],
            },
          },
          create: {
            pergunta_id: pergunta.id,
            letra: 'abcd'[i],
            texto,
            dimensao,
            peso: 1,
            ativo: true,
          },
          update: { texto, dimensao, peso: 1, ativo: true },
        });
      }
    }
  });

  console.log('DISC v1 pt-BR: 24 blocos e 96 alternativas conferidos.');
}

if (require.main === module) {
  seedDisc()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
