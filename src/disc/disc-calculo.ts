import { DiscDimensao } from '@prisma/client';

type Dimensao = DiscDimensao;

type RespostaCalculo = {
  alternativa_mais: {
    dimensao: Dimensao;
  };
  alternativa_menos: {
    dimensao: Dimensao;
  };
  tempo_ms: number;
  pergunta: {
    numero_bloco: number;
  };
};

const DIMENSOES: Dimensao[] = ['D', 'I', 'S', 'C'];

const BLENDS: Record<string, string> = {
  DI: 'Perfil DI — Resultados com Comunicação',
  DS: 'Perfil DS — Realização com Persistência',
  DC: 'Perfil DC — Comando com Rigor Técnico',
  ID: 'Perfil ID — Persuasão Direcionada a Metas',
  IS: 'Perfil IS — Conexão Interpessoal e Apoio',
  IC: 'Perfil IC — Articulação com Base Crítica',
  SD: 'Perfil SD — Cooperação com Foco em Objetivos',
  SI: 'Perfil SI — Harmonia e Acolhimento Social',
  SC: 'Perfil SC — Método, Lealdade e Conformidade',
  CD: 'Perfil CD — Análise Estratégica e Exatidão',
  CI: 'Perfil CI — Mediação Baseada em Padrões',
  CS: 'Perfil CS — Rigor Técnico e Confiabilidade Estável',
};

export function calcularDisc(respostas: RespostaCalculo[]) {
  const scores: Record<Dimensao, number> = {
    D: 0,
    I: 0,
    S: 0,
    C: 0,
  };

  const positivos = { ...scores };
  const negativos = { ...scores };

  for (const resposta of respostas) {
    const mais = resposta.alternativa_mais.dimensao;
    const menos = resposta.alternativa_menos.dimensao;

    scores[mais]++;
    scores[menos]--;

    positivos[mais]++;
    negativos[menos]++;
  }

  const ordenadas = [...DIMENSOES].sort((a, b) => {
    if (scores[a] !== scores[b]) {
      return scores[b] - scores[a];
    }

    if (positivos[a] !== positivos[b]) {
      return positivos[b] - positivos[a];
    }

    if (negativos[a] !== negativos[b]) {
      return negativos[a] - negativos[b];
    }

    return DIMENSOES.indexOf(a) - DIMENSOES.indexOf(b);
  });

  const dominante = ordenadas[0];
  const secundaria = ordenadas[1];

  const blendCodigo = `${dominante}${secundaria}`;

  const tempoTotal = respostas.reduce(
    (total, resposta) => total + resposta.tempo_ms,
    0,
  );

  const tempoMedio = Math.round(tempoTotal / respostas.length);

  const ordenadasPorTempo = [...respostas].sort(
    (a, b) =>
      a.tempo_ms - b.tempo_ms ||
      a.pergunta.numero_bloco - b.pergunta.numero_bloco,
  );

  const blocoMaisRapido = ordenadasPorTempo[0].pergunta.numero_bloco;

  const blocoMaisLento =
    ordenadasPorTempo[ordenadasPorTempo.length - 1].pergunta.numero_bloco;

  const alertas: string[] = [];

  if (tempoMedio < 10000) {
    alertas.push('RESPOSTA_MUITO_RAPIDA');
  }

  if (tempoMedio > 90000) {
    alertas.push('RESPOSTA_MUITO_LENTA');
  }

  if (tempoTotal > 1500000) {
    alertas.push('TEMPO_TOTAL_EXCESSIVO');
  }

  return {
    scores,
    positivos,
    negativos,
    dominante,
    secundaria,
    blendCodigo,
    blendTitulo: BLENDS[blendCodigo],
    tempoTotal,
    tempoMedio,
    blocoMaisRapido,
    blocoMaisLento,
    alertas,
    alertaTempo: alertas.length ? alertas.join(',') : 'RITMO_PADRAO',
  };
}
