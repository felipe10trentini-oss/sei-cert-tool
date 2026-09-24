import type { ComunicadoData } from "./types";

// Ordem em que os rótulos aparecem no texto extraído do PDF. "Quantidade:"
// não é um campo oficial do comunicado — é um sub-rótulo dentro da célula
// "N° e descrição dos volumes", mas aparece como sua própria linha no texto
// extraído, então tratamos como mais um rótulo da sequência.
const LABELS: { key: string; label: string }[] = [
  { key: "comunicadoNumero", label: "Comunicado de tratamento n°:" },
  { key: "razaoCnpj", label: "Razão Social/ CNPJ (Tomador de serviço):" },
  { key: "enderecoTratamento", label: "Endereço do local de realização do tratamento:" },
  { key: "unidadeVolante", label: "Unidade volante:" },
  { key: "destinoComunicado", label: "Destino:" },
  { key: "produto", label: "Produto a ser tratado:" },
  { key: "volumes", label: "N° e descrição dos volumes:" },
  { key: "quantidade", label: "Quantidade:" },
  { key: "marcasDistintivas", label: "Marcas distintivas:" },
  { key: "modalidade", label: "Modalidade de tratamento:" },
  { key: "dataInicioPrevista", label: "Data do início do tratamento:" },
  { key: "horarioInicioPrevisto", label: "Horário do início do tratamento:" },
  { key: "duracaoPrevista", label: "Duração do tratamento:" },
  { key: "temperaturaPrevista", label: "Temperatura:" },
  { key: "observacao", label: "Observação:" },
];

/**
 * Extrai os campos do PDF de Comunicado de Tratamento com fins Quarentenários.
 * O texto vem "rótulo: valor" por linha, mas alguns valores (endereço,
 * quantidade) continuam em linhas seguintes sem rótulo — por isso o parser é
 * sequencial: cada linha reconhecida como rótulo abre um novo campo, e linhas
 * sem rótulo continuam o campo atual.
 */
export function parseComunicado(text: string): ComunicadoData {
  const values: Record<string, string> = {};
  let currentKey: string | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = LABELS.find((l) => line.startsWith(l.label));
    if (match) {
      currentKey = match.key;
      const rest = line.slice(match.label.length).trim();
      values[currentKey] = rest;
    } else if (currentKey) {
      values[currentKey] = (values[currentKey] ? values[currentKey] + " " : "") + line;
    }
  }

  const razaoCnpj = values["razaoCnpj"] ?? "";
  const m = razaoCnpj.match(/(.*?);\s*CNPJ\s*([\d./-]+)/);
  const clienteNome = m ? m[1].trim() : razaoCnpj || null;
  const clienteCnpj = m ? m[2].trim() : null;

  return {
    comunicadoNumero: values["comunicadoNumero"] ?? null,
    clienteNome,
    clienteCnpj,
    enderecoTratamento: values["enderecoTratamento"] ?? null,
    unidadeVolante: values["unidadeVolante"] ?? null,
    destinoComunicado: values["destinoComunicado"] ?? null,
    produto: values["produto"] ?? null,
    volumes: values["volumes"] ?? null,
    quantidade: values["quantidade"] ?? null,
    marcasDistintivas: values["marcasDistintivas"] ?? null,
    modalidade: values["modalidade"] ?? null,
    dataInicioPrevista: values["dataInicioPrevista"] ?? null,
    horarioInicioPrevisto: values["horarioInicioPrevisto"] ?? null,
    duracaoPrevista: values["duracaoPrevista"] ?? null,
    temperaturaPrevista: values["temperaturaPrevista"] ?? null,
    observacao: values["observacao"] ?? null,
  };
}
