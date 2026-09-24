/**
 * Importa a aba "DADOS" da planilha COMUNICADO ...xlsx para a tabela
 * `clientes` do Supabase. Rode uma vez para popular a base, e de novo
 * sempre que a planilha for atualizada (faz upsert por CNPJ).
 *
 * Uso:
 *   npx tsx scripts/import-clientes.ts "caminho/para/COMUNICADO 001-2026- MANN (BR-PR0765).xlsx"
 *
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as fs from "node:fs";
import * as path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const xlsxPath = process.argv[2];
  if (!xlsxPath) {
    console.error("Uso: npx tsx scripts/import-clientes.ts <caminho-da-planilha.xlsx>");
    process.exit(1);
  }
  if (!fs.existsSync(xlsxPath)) {
    console.error(`Arquivo não encontrado: ${xlsxPath}`);
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets["DADOS"];
  if (!sheet) {
    console.error('Aba "DADOS" não encontrada na planilha.');
    process.exit(1);
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const dataRows = rows.slice(1); // pula o cabeçalho

  const clientes = dataRows
    .filter((r) => r[1] && r[2]) // precisa de nome e CNPJ
    .map((r) => ({
      apelido: r[0] ? String(r[0]) : null,
      nome: String(r[1]),
      cnpj: String(r[2]),
      endereco: r[3] ? String(r[3]) : null,
      email: r[4] ? String(r[4]) : null,
      telefone: r[5] ? String(r[5]) : null,
      endereco_escritorio: r[6] ? String(r[6]) : null,
    }));

  console.log(`Encontrados ${clientes.length} clientes na planilha.`);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Como não há coluna única (cnpj pode repetir se a planilha tiver duplicatas),
  // limpamos e reinserimos tudo — mais simples para uma base pequena como esta.
  const { error: delError } = await supabase.from("clientes").delete().neq("id", 0);
  if (delError) {
    console.error("Falha ao limpar tabela clientes:", delError.message);
    process.exit(1);
  }

  const { error: insError } = await supabase.from("clientes").insert(clientes);
  if (insError) {
    console.error("Falha ao inserir clientes:", insError.message);
    process.exit(1);
  }

  console.log(`Importação concluída: ${clientes.length} clientes.`);
}

main();
