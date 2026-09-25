import { NextResponse } from "next/server";
import { respostaNaoAutorizado, senhaEquipeValida } from "@/lib/auth";
import { COLUNAS_MAPA, type MapaLinha } from "@/lib/mapaPlanilha";
import {
  TabelaAusenteError,
  atualizarLinha,
  listarPorMes,
  removerLinha,
  salvarLinha,
} from "@/lib/planilhaDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function linhaValida(v: unknown): v is MapaLinha {
  return (
    typeof v === "object" &&
    v !== null &&
    COLUNAS_MAPA.every((c) => typeof (v as Record<string, unknown>)[c.key] === "string")
  );
}

function erro(err: unknown) {
  if (err instanceof TabelaAusenteError) {
    return NextResponse.json(
      { error: "tabela_ausente", mensagem: "A tabela certificados_emitidos ainda não existe no Supabase." },
      { status: 503 }
    );
  }
  console.error("Erro na planilha do MAPA", err);
  return NextResponse.json({ error: err instanceof Error ? err.message : "Erro desconhecido." }, { status: 500 });
}

export async function GET(req: Request) {
  if (!senhaEquipeValida(req)) return respostaNaoAutorizado();
  const url = new URL(req.url);
  const ano = Number(url.searchParams.get("ano"));
  const mes = Number(url.searchParams.get("mes"));
  if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    return NextResponse.json({ error: "Informe ano e mês válidos." }, { status: 400 });
  }
  try {
    return NextResponse.json({ itens: await listarPorMes(ano, mes) });
  } catch (e) {
    return erro(e);
  }
}

export async function POST(req: Request) {
  if (!senhaEquipeValida(req)) return respostaNaoAutorizado();
  const body = await req.json().catch(() => null);
  if (!linhaValida(body?.linha)) return NextResponse.json({ error: "Linha inválida." }, { status: 400 });
  try {
    return NextResponse.json({ item: await salvarLinha(body.linha) });
  } catch (e) {
    return erro(e);
  }
}

export async function PATCH(req: Request) {
  if (!senhaEquipeValida(req)) return respostaNaoAutorizado();
  const id = Number(new URL(req.url).searchParams.get("id"));
  const body = await req.json().catch(() => null);
  if (!Number.isInteger(id) || !linhaValida(body?.linha)) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  try {
    return NextResponse.json({ item: await atualizarLinha(id, body.linha) });
  } catch (e) {
    return erro(e);
  }
}

export async function DELETE(req: Request) {
  if (!senhaEquipeValida(req)) return respostaNaoAutorizado();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  try {
    await removerLinha(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erro(e);
  }
}
