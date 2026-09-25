import { NextRequest, NextResponse } from "next/server";
import { extractPdf } from "@/lib/pdfText";
import { parseComunicado } from "@/lib/parseComunicado";
import { parseCurvaCRG08 } from "@/lib/parseCurvaCRG08";
import { buildCertificado } from "@/lib/buildCertificado";
import { lookupClienteByCnpj } from "@/lib/clientes";
import { guessNumeroCertificado } from "@/lib/numeroCertificado";
import { buildLinhaMapa } from "@/lib/buildMapa";

export const runtime = "nodejs";

async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const curvaFile = formData.get("curva");
  const comunicadoFile = formData.get("comunicado");
  const numeroCertificadoInformado = ((formData.get("numeroCertificado") as string | null) ?? "").trim();

  if (!(curvaFile instanceof File) || !(comunicadoFile instanceof File)) {
    return NextResponse.json(
      { error: "Envie os dois arquivos: curva (PDF) e comunicado (PDF)." },
      { status: 400 }
    );
  }

  try {
    const [curvaPdf, comunicadoPdf] = await Promise.all([
      extractPdf(await fileToBuffer(curvaFile)),
      extractPdf(await fileToBuffer(comunicadoFile)),
    ]);

    const curva = parseCurvaCRG08(curvaPdf.text);
    const comunicado = parseComunicado(comunicadoPdf.text);

    let cliente = null;
    try {
      cliente = await lookupClienteByCnpj(comunicado.clienteCnpj);
    } catch {
      // Supabase pode não estar configurado ainda (ex.: rodando local sem .env).
      // Segue sem os dados do cliente; o front avisa que precisa conferir.
    }

    const numeroCertificado =
      numeroCertificadoInformado ||
      guessNumeroCertificado(curvaFile.name, curva.dataInicio) ||
      "";

    const resultado = buildCertificado(curva, comunicado, cliente, numeroCertificado);

    const mapa = buildLinhaMapa({
      curva,
      comunicado,
      dataComunicado: comunicadoPdf.criadoEm,
      numeroCertificado,
    });

    return NextResponse.json({ ...resultado, mapa });
  } catch (err) {
    console.error("Falha ao extrair PDFs", err);
    return NextResponse.json(
      { error: "Não foi possível ler um dos PDFs. Confira se os arquivos não estão corrompidos." },
      { status: 422 }
    );
  }
}
