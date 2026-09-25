/**
 * Compara a linha da planilha do MAPA gerada pela API local com linhas reais
 * já lançadas na aba TÉRMICO (exportadas para JSON: { "1490/2026": [26 colunas] }).
 *
 *   $env:CERT_DIR = "pasta com os PDFs"; $env:MAPA_JSON = "linhas.json"
 *   npm run regress:mapa -- 1489 1490 1495
 */
import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const dir = process.env.CERT_DIR;
const jsonPath = process.env.MAPA_JSON;
if (!dir || !jsonPath) {
  console.error("Defina CERT_DIR e MAPA_JSON.");
  process.exit(1);
}
// Procura recursivamente (os PDFs ficam em subpastas por mês: Gráficos, Certificados, Comunicados).
const caminhos = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(d, e.name));
    else {
      // Os números de certificado recomeçam todo ano: em caso de nome repetido, vale o de 2026.
      const atual = caminhos.get(e.name);
      const novo = path.join(d, e.name);
      if (!atual || (!atual.includes(`${path.sep}2026${path.sep}`) && novo.includes(`${path.sep}2026${path.sep}`))) {
        caminhos.set(e.name, novo);
      }
    }
  }
})(dir);
const em2026 = (n) => caminhos.get(n).includes(`${path.sep}2026${path.sep}`);
const files = [...caminhos.keys()].sort((a, b) => Number(em2026(b)) - Number(em2026(a)));
const real = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

const KEYS = [
  "objetivo", "finalidade", "numComunicado", "processoComunicado", "dataComunicado", "tomador", "cnpj",
  "responsavel", "produto", "volumes", "unidades", "quantidade", "unidade", "pais", "dataTratamento",
  "horario", "local", "modalidade", "unidadeTratamento", "volumeCamara", "ciclo", "temperatura",
  "duracao", "numCertificado", "processoCertificado", "dataEmissao",
];
const IGNORAR = new Set(["processoCertificado", "dataEmissao"]);

async function certComunicado(num) {
  const f = files.find((x) => x.startsWith(`CERT ${num} `));
  const p = new PDFParse({ data: fs.readFileSync(caminhos.get(f)) });
  const t = (await p.getText()).text.replace(/\s+/g, " ");
  await p.destroy();
  return t.match(/Tratamento: (\d+)\/(\d{4})(-[A-Z0-9]+)?/);
}

let total = 0, bad = 0;
for (const num of process.argv.slice(2)) {
  const curvaName = files.find((f) => f.startsWith(`${num} MANN `) && !f.includes("SEI"));
  const m = await certComunicado(num);
  const comName = files.find((f) => f.startsWith(`COMUNICADO ${m[1]}-${m[2]}${m[3] ?? ""}`) &&
    (m[3] ? true : !/^COMUNICADO \d+-\d{4}-[A-Z]/.test(f)));
  const form = new FormData();
  form.append("curva", new Blob([fs.readFileSync(caminhos.get(curvaName))], { type: "application/pdf" }), curvaName);
  form.append("comunicado", new Blob([fs.readFileSync(caminhos.get(comName))], { type: "application/pdf" }), comName);
  const data = await (await fetch("http://localhost:3000/api/extract", { method: "POST", body: form })).json();
  const linhaReal = real[`${num}/2026`];
  if (!linhaReal) { console.log(num, "sem linha real na planilha"); continue; }
  const diffs = [];
  KEYS.forEach((k, i) => {
    if (IGNORAR.has(k)) return;
    total++;
    const gerado = String(data.mapa?.[k] ?? "").trim();
    if (gerado !== linhaReal[i]) { bad++; diffs.push(`  ${k}: gerado="${gerado}" | planilha="${linhaReal[i]}"`); }
  });
  console.log(`${num}: ${diffs.length ? "\n" + diffs.join("\n") : "OK"}`);
}
console.log(`\nTotal: ${total} células, divergentes: ${bad}`);
