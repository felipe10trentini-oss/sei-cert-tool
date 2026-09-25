import ExcelJS from "exceljs";
import { getSupabaseServerClient } from "./supabaseServer";

export interface ClienteLinha {
  apelido: string | null;
  nome: string;
  cnpj: string;
  endereco: string | null;
  email: string | null;
  telefone: string | null;
  endereco_escritorio: string | null;
}

interface ClienteBanco extends ClienteLinha {
  id: number;
}

export interface ResumoImportacao {
  totalNaPlanilha: number;
  novos: { nome: string; cnpj: string }[];
  atualizados: { nome: string; cnpj: string; campos: string[] }[];
  iguais: number;
  ignoradas: number;
  ausentesNaPlanilha: number;
  aplicado: boolean;
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
export const soDigitos = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

function textoDaCelula(valor: ExcelJS.CellValue): string | null {
  if (valor == null) return null;
  if (typeof valor === "object") {
    if ("richText" in valor) return valor.richText.map((r) => r.text).join("").trim() || null;
    if ("text" in valor) return String(valor.text).trim() || null; // e-mail com hiperlink
    if ("result" in valor) return valor.result == null ? null : String(valor.result).trim() || null;
    if (valor instanceof Date) return valor.toISOString();
    return null;
  }
  const t = String(valor).trim();
  return t === "" ? null : t;
}

const COLUNAS: Record<string, keyof ClienteLinha> = {
  cliente: "apelido",
  nome: "nome",
  cnpj: "cnpj",
  endereco: "endereco",
  "e-mail": "email",
  email: "email",
  telefone: "telefone",
  "endereco escritorio": "endereco_escritorio",
};

/** Lê a aba DADOS (ou a primeira aba) e devolve os clientes, achando as colunas pelo cabeçalho. */
export async function lerPlanilhaClientes(
  buffer: Buffer
): Promise<{ linhas: ClienteLinha[]; ignoradas: number }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.worksheets.find((w) => /^dados$/i.test(w.name.trim())) ?? wb.worksheets[0];
  if (!ws) throw new Error("A planilha não tem nenhuma aba.");

  let cabecalho = -1;
  const mapa = new Map<number, keyof ClienteLinha>();
  for (let r = 1; r <= Math.min(ws.rowCount, 15) && cabecalho < 0; r++) {
    const tentativa = new Map<number, keyof ClienteLinha>();
    ws.getRow(r).eachCell((cell, col) => {
      const campo = COLUNAS[semAcento(textoDaCelula(cell.value) ?? "")];
      if (campo) tentativa.set(col, campo);
    });
    if ([...tentativa.values()].includes("cnpj") && [...tentativa.values()].includes("nome")) {
      cabecalho = r;
      tentativa.forEach((v, k) => mapa.set(k, v));
    }
  }
  if (cabecalho < 0) {
    throw new Error('Não encontrei as colunas "Nome" e "CNPJ" no topo da planilha.');
  }

  const porCnpj = new Map<string, ClienteLinha>();
  let ignoradas = 0;
  for (let r = cabecalho + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const dados: Partial<Record<keyof ClienteLinha, string | null>> = {};
    mapa.forEach((campo, col) => {
      dados[campo] = textoDaCelula(row.getCell(col).value);
    });
    if (!dados.nome && !dados.cnpj) continue; // linha vazia
    if (!dados.nome || soDigitos(dados.cnpj).length !== 14) {
      ignoradas++;
      continue;
    }
    porCnpj.set(soDigitos(dados.cnpj), {
      apelido: dados.apelido ?? null,
      nome: dados.nome,
      cnpj: dados.cnpj!,
      endereco: dados.endereco ?? null,
      email: dados.email ?? null,
      telefone: dados.telefone ?? null,
      endereco_escritorio: dados.endereco_escritorio ?? null,
    });
  }
  return { linhas: [...porCnpj.values()], ignoradas };
}

const CAMPOS_COMPARAVEIS: (keyof ClienteLinha)[] = [
  "apelido", "nome", "cnpj", "endereco", "email", "telefone", "endereco_escritorio",
];
const norm = (v: string | null | undefined) => (v ?? "").trim();

/** Compara com o banco (por CNPJ) e, se `aplicar`, insere os novos e atualiza os alterados. Nunca apaga. */
export async function sincronizarClientes(linhas: ClienteLinha[], ignoradas: number, aplicar: boolean): Promise<ResumoImportacao> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, apelido, nome, cnpj, endereco, email, telefone, endereco_escritorio")
    .limit(5000)
    .returns<ClienteBanco[]>();
  if (error) throw new Error(`Falha ao ler clientes: ${error.message}`);

  const existentes = new Map<string, ClienteBanco>();
  for (const c of data ?? []) if (!existentes.has(soDigitos(c.cnpj))) existentes.set(soDigitos(c.cnpj), c);

  const novos: ClienteLinha[] = [];
  const alterar: { id: number; linha: ClienteLinha }[] = [];
  const resumo: ResumoImportacao = {
    totalNaPlanilha: linhas.length, novos: [], atualizados: [], iguais: 0, ignoradas, ausentesNaPlanilha: 0, aplicado: aplicar,
  };

  const cnpjsPlanilha = new Set(linhas.map((l) => soDigitos(l.cnpj)));
  for (const l of linhas) {
    const atual = existentes.get(soDigitos(l.cnpj));
    if (!atual) {
      novos.push(l);
      resumo.novos.push({ nome: l.nome, cnpj: l.cnpj });
      continue;
    }
    const campos = CAMPOS_COMPARAVEIS.filter((k) => norm(l[k]) !== norm(atual[k]));
    if (campos.length === 0) resumo.iguais++;
    else {
      alterar.push({ id: atual.id, linha: l });
      resumo.atualizados.push({ nome: l.nome, cnpj: l.cnpj, campos });
    }
  }
  resumo.ausentesNaPlanilha = [...existentes.keys()].filter((k) => !cnpjsPlanilha.has(k)).length;

  if (aplicar) {
    if (novos.length) {
      const { error: e } = await supabase.from("clientes").insert(novos);
      if (e) throw new Error(`Falha ao inserir clientes: ${e.message}`);
    }
    for (const a of alterar) {
      const { error: e } = await supabase.from("clientes").update(a.linha).eq("id", a.id);
      if (e) throw new Error(`Falha ao atualizar ${a.linha.nome}: ${e.message}`);
    }
  }
  return resumo;
}

export async function contarClientes(): Promise<number> {
  const { count, error } = await getSupabaseServerClient()
    .from("clientes")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}
