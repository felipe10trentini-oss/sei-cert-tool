import { NextResponse } from "next/server";
import { contarClientes } from "@/lib/clientesImport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ total: await contarClientes() });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar o cadastro de clientes." }, { status: 503 });
  }
}
