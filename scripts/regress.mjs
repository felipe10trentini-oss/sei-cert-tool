/**
 * Teste de regressão: gera os campos com a API local (npm run dev) a partir da
 * curva + comunicado de cada certificado já emitido e compara, campo a campo,
 * com o PDF do certificado oficial.
 *
 * Uso (PowerShell):
 *   $env:CERT_DIR = "C:\pasta\com\CERT 1489 ..., 1489 MANN 929.pdf e COMUNICADO ...pdf"
 *   npm run regress -- 1489 1490 1495
 */
import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const dir = process.env.CERT_DIR;
if (!dir) {
  console.error("Defina CERT_DIR com a pasta que contém os PDFs.");
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

const ROTULOS = [
  ["1.1", "1.1. Razão social:"], ["1.2", "1.2. CNPJ:"], ["1.3", "1.3. Nº de registro no CREA:"],
  ["1.4", "1.4. Endereço completo com CEP:"], ["1.5", "1.5. Telefone:"], ["1.6", "1.6. Endereço Eletrônico:"],
  ["1.7", "1.7. Código alfanumérico do cadastro junto ao MAPA:"], ["2.1", "2.1. Razão Social:"], ["2.2", "2.2 CNPJ:"],
  ["2.3", "2.3. Endereço completo com CEP:"], ["2.4", "2.4. Telefone:"], ["2.5", "2.5 Endereço eletrônico:"],
  ["3.1", "3.1. Número do Comunicado de Tratamento:"],
  ["3.2", "3.2. Endereço completo onde foi realizado o tratamento fitossanitário com fins quarentenários:"],
  ["3.3", "3.3. Destino:"], ["3.4", "3.4. Descrição do produto:"], ["3.5", "3.5. Número e descrição dos volumes:"],
  ["3.6", "3.6. Quantidade de produto tratado:"], ["3.7", "3.7. Número do lote:"],
  ["3.8", "3.8. Número do Ciclo de Tratamento:"], ["3.9", "3.9. Marcas distintivas:"],
  ["3.10", "3.10. Modalidade de Tratamento:"], ["3.11", "3.11. Data do início do tratamento:"],
  ["3.12", "3.12. Horário do início do tratamento:"], ["3.13", "3.13. Data do término do tratamento:"],
  ["3.14", "3.14. Horário do término do tratamento:"], ["3.15", "3.15. Temperatura:"], ["4", "4. Local de emissão:"],
];

async function pdfText(buf) {
  const p = new PDFParse({ data: buf });
  const t = (await p.getText()).text;
  await p.destroy();
  return t;
}
const flat = (s) => s.replace(/\s+/g, " ").trim();

function parseFields(text) {
  const t = flat(text);
  const out = {};
  let pos = 0;
  const idx = ROTULOS.map(([k, l]) => {
    const i = t.indexOf(flat(l), pos);
    if (i >= 0) pos = i + l.length;
    return [k, l, i];
  });
  idx.forEach(([k, l, i], n) => {
    if (i < 0) return;
    const start = i + flat(l).length;
    const next = idx.slice(n + 1).find((x) => x[2] >= 0);
    let end = next ? next[2] : t.indexOf("- DECLARO", start);
    if (k === "4") end = t.indexOf("- DECLARO", start);
    out[k] = t
      .slice(start, end < 0 ? undefined : end)
      .trim()
      .replace(/ (2\. Dados do Tomador de Serviço|3\. Dados do Tratamento.*|Certificado TFQ - HT.*)$/, "")
      .replace("BR- PR", "BR-PR");
  });
  return out;
}

let total = 0;
let bad = 0;
for (const num of process.argv.slice(2)) {
  const certName = files.find((f) => f.startsWith(`CERT ${num} `));
  const curvaName = files.find((f) => f.startsWith(`${num} MANN `) && !f.includes("SEI"));
  if (!certName || !curvaName) { console.log(num, "arquivos não encontrados"); continue; }
  const cert = parseFields(await pdfText(fs.readFileSync(caminhos.get(certName))));
  const m = cert["3.1"]?.match(/(\d+)\/(\d{4})(-[A-Z0-9]+)?/);
  const comName = m && files.find((f) => f.startsWith(`COMUNICADO ${m[1]}-${m[2]}${m[3] ?? ""}`) &&
    (m[3] ? true : !/^COMUNICADO \d+-\d{4}-[A-Z]/.test(f)));
  if (!comName) { console.log(num, "comunicado não encontrado"); continue; }

  const form = new FormData();
  form.append("curva", new Blob([fs.readFileSync(caminhos.get(curvaName))], { type: "application/pdf" }), curvaName);
  form.append("comunicado", new Blob([fs.readFileSync(caminhos.get(comName))], { type: "application/pdf" }), comName);
  const res = await fetch("http://localhost:3000/api/extract", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) { console.log(num, "erro API", data); continue; }
  const c = data.campos;
  const gen = {
    "1.1": c["1.1_razaoSocial"], "1.2": c["1.2_cnpj"], "1.3": c["1.3_crea"], "1.4": c["1.4_endereco"],
    "1.5": c["1.5_telefone"], "1.6": c["1.6_email"], "1.7": c["1.7_codigoMapa"], "2.1": c["2.1_razaoSocialCliente"],
    "2.2": c["2.2_cnpjCliente"], "2.3": c["2.3_enderecoCliente"], "2.4": c["2.4_telefoneCliente"],
    "2.5": c["2.5_emailCliente"], "3.1": c["3.1_numeroComunicado"], "3.2": c["3.2_enderecoTratamento"],
    "3.3": c["3.3_destino"], "3.4": c["3.4_descricaoProduto"], "3.5": c["3.5_volumes"], "3.6": c["3.6_quantidade"],
    "3.7": c["3.7_lote"], "3.8": c["3.8_ciclo"], "3.9": c["3.9_marcasDistintivas"], "3.10": c["3.10_modalidade"],
    "3.11": c["3.11_dataInicio"], "3.12": c["3.12_horarioInicio"], "3.13": c["3.13_dataTermino"],
    "3.14": c["3.14_horarioTermino"], "3.15": c["3.15_temperaturaDuracao"], "4": c["4_localEmissao"],
  };
  const diffs = [];
  for (const [k] of ROTULOS) {
    total++;
    if (flat(String(gen[k] ?? "")) !== (cert[k] ?? "")) {
      bad++;
      diffs.push(`  ${k}: gerado="${gen[k]}" | oficial="${cert[k]}"`);
    }
  }
  console.log(`CERT ${num} (${curvaName} + ${comName}) avisos=${JSON.stringify(data.avisos)}`);
  console.log(diffs.length ? diffs.join("\n") : "  OK (todos os campos iguais)");
}
console.log(`\nTotal comparado: ${total} campos, divergentes: ${bad}`);
