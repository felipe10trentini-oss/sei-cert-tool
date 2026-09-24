// Precisa ser importado antes de "pdf-parse" para configurar o worker em
// ambientes serverless (Vercel) — sem isso, pdfjs-dist falha com
// "ReferenceError: DOMMatrix is not defined".
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

/** Extrai o texto de todas as páginas de um PDF a partir de um Buffer. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
