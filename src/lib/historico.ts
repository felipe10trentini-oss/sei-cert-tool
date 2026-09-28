import { getSupabaseServerClient } from "./supabaseServer";
import { COLUNAS_MAPA, type MapaLinha } from "./mapaPlanilha";
import type { Divergencia } from "./types";

interface Registro {
  id: number;
  numero_certificado: string;
  linha: Partial<MapaLinha>;
  created_at: string;
}

/** "24/09/2026" -> "2026-09-24" */
function dataBrParaIso(data: string | undefined): string | null {
  const m = (data ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function quando(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function linhaValida(v: unknown): v is MapaLinha {
  return (
    typeof v === "object" &&
    v !== null &&
    COLUNAS_MAPA.every((c) => typeof (v as Record<string, unknown>)[c.key] === "string")
  );
}

/**
 * Procura no histórico de emissões o mesmo certificado ou o mesmo comunicado.
 * Se o histórico estiver indisponível, não bloqueia: devolve lista vazia.
 */
export async function verificarDuplicidade(args: {
  numeroCertificado: string;
  numeroComunicado: string | null;
}): Promise<Divergencia[]> {
  const { numeroCertificado, numeroComunicado } = args;
  const achados: Divergencia[] = [];
  try {
    const supabase = getSupabaseServerClient();

    if (numeroCertificado) {
      const { data, error } = await supabase
        .from("certificados_emitidos")
        .select("id, numero_certificado, linha, created_at")
        .eq("numero_certificado", numeroCertificado)
        .returns<Registro[]>();
      if (error) throw error;
      for (const r of data ?? []) {
        const mesmoComunicado = !numeroComunicado || r.linha.numComunicado === numeroComunicado;
        achados.push(
          mesmoComunicado
            ? {
                nivel: "atencao",
                campo: "Certificado já copiado",
                rotulos: ["Agora", "Histórico"],
                comunicado: `certificado ${numeroCertificado}, comunicado ${numeroComunicado ?? "—"}`,
                curva: `copiado em ${quando(r.created_at)}`,
                detalhe: `Este certificado já foi copiado em ${quando(r.created_at)}. Se for o mesmo, ignore.`,
              }
            : {
                nivel: "erro",
                campo: "Número de certificado repetido",
                rotulos: ["Agora", "Histórico"],
                comunicado: `certificado ${numeroCertificado} com o comunicado ${numeroComunicado}`,
                curva: `certificado ${numeroCertificado} já emitido com o comunicado ${r.linha.numComunicado ?? "?"}`,
                detalhe: `O certificado ${numeroCertificado} já foi emitido (${quando(r.created_at)}) para outro comunicado.`,
              }
        );
      }
    }

    if (numeroComunicado) {
      const { data, error } = await supabase
        .from("certificados_emitidos")
        .select("id, numero_certificado, linha, created_at")
        .eq("linha->>numComunicado", numeroComunicado)
        .returns<Registro[]>();
      if (error) throw error;
      for (const r of data ?? []) {
        if (r.numero_certificado === numeroCertificado) continue;
        achados.push({
          nivel: "erro",
          campo: "Comunicado já utilizado",
          rotulos: ["Agora", "Histórico"],
          comunicado: `comunicado ${numeroComunicado} no certificado ${numeroCertificado || "(sem número)"}`,
          curva: `comunicado ${numeroComunicado} já usado no certificado ${r.numero_certificado}`,
          detalhe: `O comunicado ${numeroComunicado} já foi usado no certificado ${r.numero_certificado} (copiado em ${quando(r.created_at)}).`,
        });
      }
    }
  } catch (err) {
    console.error("Histórico indisponível para checar duplicidade", err);
  }
  return achados;
}

/** Registra (ou atualiza) a emissão pelo número do certificado. */
export async function registrarEmissao(linha: MapaLinha): Promise<{ id: number; criadoEm: string }> {
  const numero = linha.numCertificado.trim();
  if (!numero) throw new Error("Informe o número do certificado antes de registrar.");
  const { data, error } = await getSupabaseServerClient()
    .from("certificados_emitidos")
    .upsert(
      {
        numero_certificado: numero,
        data_tratamento: dataBrParaIso(linha.dataTratamento),
        linha,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "numero_certificado" }
    )
    .select("id, created_at")
    .single<{ id: number; created_at: string }>();
  if (error) throw new Error(error.message);
  return { id: data.id, criadoEm: data.created_at };
}
