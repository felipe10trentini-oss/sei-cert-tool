import { getSupabaseServerClient } from "./supabaseServer";
import { dataBrParaIso, type MapaLinha } from "./mapaPlanilha";

export interface ItemPlanilha {
  id: number;
  linha: MapaLinha;
  criadoEm: string;
}

interface Registro {
  id: number;
  linha: MapaLinha;
  created_at: string;
}

export class TabelaAusenteError extends Error {}

function tratar(error: { code?: string; message: string } | null) {
  if (!error) return;
  // PGRST205 = tabela fora do cache do PostgREST; 42P01 = tabela inexistente.
  if (error.code === "PGRST205" || error.code === "42P01") throw new TabelaAusenteError(error.message);
  throw new Error(error.message);
}

const paraItem = (r: Registro): ItemPlanilha => ({ id: r.id, linha: r.linha, criadoEm: r.created_at });

/** Linhas cuja data de tratamento cai no mês (ano/mes 1-12). */
export async function listarPorMes(ano: number, mes: number): Promise<ItemPlanilha[]> {
  const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const proximo = mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  const { data, error } = await getSupabaseServerClient()
    .from("certificados_emitidos")
    .select("id, linha, created_at")
    .gte("data_tratamento", inicio)
    .lt("data_tratamento", proximo)
    .order("data_tratamento", { ascending: true })
    .order("numero_certificado", { ascending: true })
    .returns<Registro[]>();
  tratar(error);
  return (data ?? []).map(paraItem);
}

/** Insere ou atualiza (pelo número do certificado). */
export async function salvarLinha(linha: MapaLinha): Promise<ItemPlanilha> {
  const numero = linha.numCertificado.trim();
  if (!numero) throw new Error("Informe o número do certificado antes de salvar.");
  const { data, error } = await getSupabaseServerClient()
    .from("certificados_emitidos")
    .upsert(
      { numero_certificado: numero, data_tratamento: dataBrParaIso(linha.dataTratamento), linha, updated_at: new Date().toISOString() },
      { onConflict: "numero_certificado" }
    )
    .select("id, linha, created_at")
    .single<Registro>();
  tratar(error);
  return paraItem(data as Registro);
}

export async function atualizarLinha(id: number, linha: MapaLinha): Promise<ItemPlanilha> {
  const { data, error } = await getSupabaseServerClient()
    .from("certificados_emitidos")
    .update({
      numero_certificado: linha.numCertificado.trim(),
      data_tratamento: dataBrParaIso(linha.dataTratamento),
      linha,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, linha, created_at")
    .single<Registro>();
  tratar(error);
  return paraItem(data as Registro);
}

export async function removerLinha(id: number): Promise<void> {
  const { error } = await getSupabaseServerClient().from("certificados_emitidos").delete().eq("id", id);
  tratar(error);
}
