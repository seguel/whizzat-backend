/**
 * Faz o parse seguro de um campo JSON vindo de FormData.
 * Se o valor for undefined, vazio ou inválido, retorna o fallback (por padrão, um array vazio).
 *
 * @example
 * const formacoes = safeJsonParse<CreateAvaliadorFormacaoDto[]>(body.formacoes);
 */
export function safeJsonParse<T>(
  data: unknown,
  fallback: T = [] as unknown as T,
): T {
  if (typeof data !== 'string' || !data.trim()) return fallback;

  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.warn('[safeJsonParse] Erro ao fazer parse do campo JSON:', error);
    return fallback;
  }
}
