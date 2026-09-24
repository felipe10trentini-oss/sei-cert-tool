import { getSupabaseServerClient } from "./supabaseServer";
import type { Cliente } from "./types";

function normalizeCnpj(cnpj: string | null | undefined): string {
  return (cnpj ?? "").replace(/\D/g, "");
}

interface ClienteRow {
  apelido: string | null;
  nome: string | null;
  cnpj: string | null;
  endereco: string | null;
  email: string | null;
  telefone: string | null;
  endereco_escritorio: string | null;
}

/**
 * Busca um cliente na tabela `clientes` do Supabase pelo CNPJ (ignorando
 * pontuação). Retorna null se não encontrar ou se a busca falhar.
 */
export async function lookupClienteByCnpj(cnpj: string | null): Promise<Cliente | null> {
  const target = normalizeCnpj(cnpj);
  if (!target) return null;

  // Busca todas as linhas e compara CNPJ normalizado em memória, porque o
  // CNPJ é salvo com pontuação e pode variar de formato. Com algumas
  // centenas de clientes isso é rápido; se a base crescer muito, vale criar
  // uma coluna `cnpj_normalizado` indexada e filtrar no banco.
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("apelido, nome, cnpj, endereco, email, telefone, endereco_escritorio")
    .limit(2000)
    .returns<ClienteRow[]>();

  if (error || !data) return null;

  const found = data.find((row) => normalizeCnpj(row.cnpj) === target);
  if (!found) return null;

  return {
    apelido: found.apelido,
    nome: found.nome,
    cnpj: found.cnpj,
    endereco: found.endereco,
    email: found.email,
    telefone: found.telefone,
    enderecoEscritorio: found.endereco_escritorio,
  };
}
