// Colunas da aba "TÉRMICO" da planilha de controle do MAPA (A até Z), na mesma ordem.
export const COLUNAS_MAPA = [
  { key: "objetivo", titulo: "Objetivo do Tratamento" },
  { key: "finalidade", titulo: "Finalidade (EXP. ou IMP.)" },
  { key: "numComunicado", titulo: "Nº Comunicado Tratamento" },
  { key: "processoComunicado", titulo: "Nº do Processo do Comunicado" },
  { key: "dataComunicado", titulo: "Data do Comunicado" },
  { key: "tomador", titulo: "Empresa Tomadora do Serviço" },
  { key: "cnpj", titulo: "CNPJ do Tomador" },
  { key: "responsavel", titulo: "Responsável Técnico" },
  { key: "produto", titulo: "Produto Tratado" },
  { key: "volumes", titulo: "Número de volumes" },
  { key: "unidades", titulo: "Unidades" },
  { key: "quantidade", titulo: "Quantidade de Produto Tratado" },
  { key: "unidade", titulo: "Unidade" },
  { key: "pais", titulo: "País" },
  { key: "dataTratamento", titulo: "Data do Tratamento" },
  { key: "horario", titulo: "Horário do Início" },
  { key: "local", titulo: "Local do Tratamento" },
  { key: "modalidade", titulo: "Modalidade" },
  { key: "unidadeTratamento", titulo: "Unidade de tratamento (placa)" },
  { key: "volumeCamara", titulo: "Volume da Câmara (m³ ou L)" },
  { key: "ciclo", titulo: "Nº do Ciclo" },
  { key: "temperatura", titulo: "Temperatura (ºC)" },
  { key: "duracao", titulo: "Duração (min)" },
  { key: "numCertificado", titulo: "Nº do Certificado" },
  { key: "processoCertificado", titulo: "Nº do processo do Certificado" },
  { key: "dataEmissao", titulo: "Data de emissão do Certificado" },
] as const;

export type MapaKey = (typeof COLUNAS_MAPA)[number]["key"];
export type MapaLinha = Record<MapaKey, string>;

const limpar = (v: string | undefined) => (v ?? "").replace(/[\t\r\n]+/g, " ").trim();

/** Linha separada por TAB: cola direto nas colunas A–Z do Excel. */
export function linhaParaTsv(linha: MapaLinha): string {
  return COLUNAS_MAPA.map((c) => limpar(linha[c.key])).join("\t");
}

export function cabecalhoTsv(): string {
  return COLUNAS_MAPA.map((c) => c.titulo).join("\t");
}

/** "24/09/2026" -> "2026-09-24" (para filtrar por mês no banco). */
export function dataBrParaIso(data: string | undefined): string | null {
  const m = (data ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function linhaVazia(): MapaLinha {
  return Object.fromEntries(COLUNAS_MAPA.map((c) => [c.key, ""])) as MapaLinha;
}
