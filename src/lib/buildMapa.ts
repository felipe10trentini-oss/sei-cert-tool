import { EMPRESA, MAPA_CONSTANTES, PLACA_POR_UNIDADE } from "./empresa";
import { linhaVazia, type MapaLinha } from "./mapaPlanilha";
import type { ComunicadoData, CurvaData } from "./types";

/** "Rua X, 4226 - Cambé - PR" -> "Cambé". */
export function cidadeDoEndereco(endereco: string | null | undefined): string {
  if (!endereco) return "";
  const partes = endereco.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  if (partes.length && /^[A-Z]{2}$/.test(partes[partes.length - 1])) partes.pop();
  // "Londrina (Hag Palete)" -> "Londrina"
  return partes.length > 1 ? partes[partes.length - 1].replace(/\s*\(.*?\)\s*/g, " ").trim() : "";
}

function hojeBR(): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/**
 * Monta a linha da aba TÉRMICO da planilha do MAPA. O que não dá para saber
 * pelos PDFs (nº do processo do certificado) fica em branco para preencher depois.
 */
export function buildLinhaMapa(args: {
  curva: CurvaData;
  comunicado: ComunicadoData;
  dataComunicado: string | null;
  numeroCertificado: string;
}): MapaLinha {
  const { curva, comunicado, dataComunicado, numeroCertificado } = args;
  const linha = linhaVazia();

  const modalidade = comunicado.modalidade?.split(/\s+-\s+/).pop()?.trim() || "AQF";
  const lote = curva.loteCiclo ? String(parseInt(curva.loteCiclo, 10)) : "";
  const volumes =
    curva.volumeTotalPecas ??
    (/^\d+$/.test(comunicado.quantidade?.trim() ?? "") ? comunicado.quantidade!.trim() : "");

  Object.assign(linha, {
    objetivo: MAPA_CONSTANTES.objetivo,
    finalidade: MAPA_CONSTANTES.finalidade,
    numComunicado: comunicado.comunicadoNumero ?? "",
    processoComunicado: MAPA_CONSTANTES.processoComunicado,
    dataComunicado: dataComunicado ?? "",
    tomador: comunicado.clienteNome ?? "",
    cnpj: comunicado.clienteCnpj ?? "",
    responsavel: EMPRESA.responsavelTecnico,
    produto: comunicado.produto?.trim() ?? "",
    volumes,
    unidades: MAPA_CONSTANTES.unidades,
    pais: comunicado.destinoComunicado ?? "Indefinido",
    dataTratamento: curva.dataInicio ?? "",
    horario: curva.horaInicio ?? "",
    local: cidadeDoEndereco(comunicado.enderecoTratamento),
    modalidade,
    unidadeTratamento: PLACA_POR_UNIDADE[comunicado.unidadeVolante ?? ""] ?? "",
    volumeCamara: MAPA_CONSTANTES.volumeCamara,
    ciclo: lote,
    temperatura: curva.temperaturaTratamento ?? "",
    duracao: curva.duracaoMin != null ? String(curva.duracaoMin) : "",
    numCertificado: numeroCertificado,
    processoCertificado: "",
    dataEmissao: hojeBR(),
  } satisfies Partial<MapaLinha>);

  return linha;
}
