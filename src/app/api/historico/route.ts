import { NextResponse } from "next/server";
import { respostaNaoAutorizado, senhaEquipeValida } from "@/lib/auth";
import { linhaValida, registrarEmissao } from "@/lib/historico";

export const runtime = "nodejs";

/** Registra no histórico que o certificado foi emitido (copiado). Exige a senha da equipe. */
export async function POST(req: Request) {
  if (!senhaEquipeValida(req)) return respostaNaoAutorizado();
  const body = await req.json().catch(() => null);
  if (!linhaValida(body?.linha)) {
    return NextResponse.json({ error: "Linha inválida." }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await registrarEmissao(body.linha)) });
  } catch (err) {
    console.error("Falha ao registrar emissão", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível registrar." },
      { status: 500 }
    );
  }
}
