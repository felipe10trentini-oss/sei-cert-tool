/**
 * O nome do arquivo da curva costuma trazer o número do certificado na
 * frente (ex: "1479 MANN 225.pdf" -> certificado 1479). O ano não vem no
 * nome do arquivo, então usamos o ano da data de início do tratamento.
 */
export function guessNumeroCertificado(
  curvaFileName: string | null | undefined,
  dataInicio: string | null | undefined
): string | null {
  if (!curvaFileName) return null;

  const base = curvaFileName.replace(/\.[^./\\]+$/, "");
  const m = base.match(/^(\d{2,6})\b/);
  if (!m) return null;
  const numero = m[1];

  const ano = dataInicio?.match(/\/(\d{4})$/)?.[1];
  return ano ? `${numero}/${ano}` : numero;
}
