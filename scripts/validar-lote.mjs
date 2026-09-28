/**
 * Roda a API local (npm run dev) sobre certificados já emitidos e resume as
 * divergências que o sistema apontaria — serve para medir falsos alarmes.
 *
 *   $env:CERT_DIR = "pasta com os PDFs"
 *   npm run validar:lote -- "9- Setembro" "8- Agosto"     (filtra por trecho do caminho)
 */
import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const dir = process.env.CERT_DIR;
if (!dir) {
  console.error("Defina CERT_DIR.");
  process.exit(1);
}
const filtros = process.argv.slice(2);
const todos = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.toLowerCase().endsWith(".pdf")) todos.push({ nome: e.name, caminho: p });
  }
})(dir);
const noAno = (x) => x.caminho.includes(`${path.sep}2026${path.sep}`);
const pool = todos.filter(noAno);
const certs = pool.filter((x) => /^CERT \d+ MANN /.test(x.nome) && !/Retif/i.test(x.nome) &&
  (filtros.length === 0 || filtros.some((f) => x.caminho.includes(f))));

async function texto(buf) {
  const p = new PDFParse({ data: buf });
  const t = (await p.getText()).text;
  await p.destroy();
  return t;
}

async function analisar(cert) {
  const m = cert.nome.match(/^CERT (\d+) (MANN \d+)/);
  const curva = pool.find((x) => x.nome === `${m[1]} ${m[2]}.pdf`);
  const t = (await texto(fs.readFileSync(cert.caminho))).replace(/\s+/g, " ");
  const c = t.match(/Tratamento: (\d+)\/(\d{4})(-[A-Z0-9]+)?/);
  const com = c && pool.find((x) => x.nome.startsWith(`COMUNICADO ${c[1]}-${c[2]}${c[3] ?? ""}`) &&
    (c[3] ? true : !/^COMUNICADO \d+-\d{4}-[A-Z]/.test(x.nome)));
  if (!curva || !com) return { cert: cert.nome, falta: !curva ? "curva" : "comunicado" };
  const form = new FormData();
  form.append("curva", new Blob([fs.readFileSync(curva.caminho)], { type: "application/pdf" }), curva.nome);
  form.append("comunicado", new Blob([fs.readFileSync(com.caminho)], { type: "application/pdf" }), com.nome);
  const r = await fetch("http://localhost:3000/api/extract", { method: "POST", body: form });
  const d = await r.json();
  return { cert: cert.nome, comunicado: com.nome, status: r.status, div: (d.divergencias ?? []).filter((x) => !/já|repetido|utilizado/i.test(x.campo)) };
}

const resultados = [];
const fila = [...certs];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (fila.length) {
    const c = fila.shift();
    try { resultados.push(await analisar(c)); } catch (e) { resultados.push({ cert: c.nome, erro: String(e) }); }
  }
}));

const porCampo = {};
let semArquivo = 0, comDiv = 0;
for (const r of resultados) {
  if (r.falta || r.erro) { semArquivo++; continue; }
  if (r.div.length) comDiv++;
  for (const x of r.div) (porCampo[`${x.nivel}: ${x.campo}`] ??= []).push({ cert: r.cert, ...x });
}
console.log(`Certificados analisados: ${resultados.length} (sem curva/comunicado localizado: ${semArquivo}); com alguma divergência: ${comDiv}`);
for (const [k, lista] of Object.entries(porCampo).sort()) {
  console.log(`\n## ${k} — ${lista.length} ocorrência(s)`);
  for (const x of lista.slice(0, 8)) console.log(`  ${x.cert}\n    comunicado: ${x.comunicado}\n    curva: ${x.curva}\n    ${x.detalhe}`);
}
