"use client";

import { useMemo, useState } from "react";
import type { CertificadoCampos } from "@/lib/types";
import { CAMPOS, SECOES } from "@/lib/certificadoFields";

interface Props {
  camposIniciais: CertificadoCampos;
  avisos: string[];
}

function buildClipboardHtml(campos: CertificadoCampos): string {
  const cell = (key: keyof CertificadoCampos) => {
    const def = CAMPOS[key];
    const valor = campos[key] ?? "";
    return `<p>${def.label}: ${escapeHtml(String(valor))}</p>`;
  };

  const rows = SECOES.flatMap((secao) => {
    const header = `<tr><td colspan="2" style="background-color:#dddddd;"><p><strong>${escapeHtml(
      secao.titulo
    )}</strong></p></td></tr>`;
    const body = secao.linhas
      .map((linha) => {
        if (linha.length === 2) {
          return `<tr><td>${cell(linha[0])}</td><td>${cell(linha[1])}</td></tr>`;
        }
        return `<tr><td colspan="2">${cell(linha[0])}</td></tr>`;
      })
      .join("\n");
    return [header, body];
  }).join("\n");

  return (
    `<p>Número do Certificado de Tratamento Fitossanitário com fins Quarentenários: ${escapeHtml(
      campos.numeroCertificado
    )}</p>` +
    `<table border="2" cellpadding="4" cellspacing="0">${rows}</table>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function CertificatePreview({ camposIniciais, avisos }: Props) {
  const [campos, setCampos] = useState<CertificadoCampos>(camposIniciais);
  const [copiado, setCopiado] = useState(false);

  const html = useMemo(() => buildClipboardHtml(campos), [campos]);

  function setCampo(key: keyof CertificadoCampos, value: string) {
    setCampos((prev) => ({ ...prev, [key]: value }));
    setCopiado(false);
  }

  async function copiar() {
    try {
      const blobHtml = new Blob([html], { type: "text/html" });
      const blobText = new Blob([html.replace(/<[^>]+>/g, "")], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blobHtml, "text/plain": blobText }),
      ]);
      setCopiado(true);
    } catch {
      // Fallback: copia como texto simples se a API de clipboard rico falhar.
      await navigator.clipboard.writeText(html.replace(/<[^>]+>/g, ""));
      setCopiado(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {avisos.length > 0 && (
        <div className="rounded-md border border-amber-400 bg-amber-50 p-4 text-amber-900 text-sm">
          <p className="font-semibold mb-1">Confira antes de copiar:</p>
          <ul className="list-disc list-inside space-y-1">
            {avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          {CAMPOS.numeroCertificado.label}
        </label>
        <input
          className="border rounded px-3 py-2 text-sm max-w-xs"
          value={campos.numeroCertificado}
          onChange={(e) => setCampo("numeroCertificado", e.target.value)}
          placeholder="ex: 1479/2026"
        />
      </div>

      {SECOES.map((secao) => (
        <div key={secao.titulo} className="border rounded-md overflow-hidden">
          <div className="bg-gray-200 px-4 py-2 font-semibold text-sm">{secao.titulo}</div>
          <div className="divide-y">
            {secao.linhas.map((linha, i) => (
              <div
                key={i}
                className={`grid ${linha.length === 2 ? "grid-cols-2" : "grid-cols-1"} divide-x`}
              >
                {linha.map((key) => (
                  <div key={key} className="p-3 flex flex-col gap-1">
                    <label className="text-xs text-gray-500">{CAMPOS[key].label}</label>
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      value={campos[key] ?? ""}
                      onChange={(e) => setCampo(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={copiar}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm"
        >
          Copiar formatado
        </button>
        {copiado && <span className="text-green-700 text-sm">Copiado! Cole no editor do SEI.</span>}
      </div>
    </div>
  );
}
