import { NextResponse } from "next/server";
import { respostaNaoAutorizado, senhaEquipeValida } from "@/lib/auth";
import { lerPlanilhaClientes, sincronizarClientes } from "@/lib/clientesImport";

export const runtime = "nodejs";
const LIMITE = 4 * 1024 * 1024; // a Vercel aceita no máximo ~4,5 MB por requisição

export async function POST(req: Request) {
  if (!senhaEquipeValida(req)) return respostaNaoAutorizado();

  const form = await req.formData();
  const arquivo = form.get("arquivo");
  const aplicar = form.get("modo") === "aplicar";
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "Envie a planilha de clientes (.xlsx)." }, { status: 400 });
  }
  if (!/\.xlsx$/i.test(arquivo.name)) {
    return NextResponse.json({ error: "O arquivo precisa ser uma planilha .xlsx." }, { status: 400 });
  }
  if (arquivo.size > LIMITE) {
    return NextResponse.json(
      { error: "Planilha maior que 4 MB. Salve uma cópia só com a aba DADOS e envie de novo." },
      { status: 413 }
    );
  }

  try {
    const { linhas, ignoradas } = await lerPlanilhaClientes(Buffer.from(await arquivo.arrayBuffer()));
    if (linhas.length === 0) {
      return NextResponse.json({ error: "Nenhum cliente com nome e CNPJ válido foi encontrado." }, { status: 422 });
    }
    return NextResponse.json(await sincronizarClientes(linhas, ignoradas, aplicar));
  } catch (err) {
    console.error("Falha na importação de clientes", err);
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
