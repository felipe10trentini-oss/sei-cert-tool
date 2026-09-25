"use client";

import { useMemo, useRef, useState } from "react";
import type { CertificadoCampos } from "@/lib/types";
import { LINHAS, ROTULOS, type CampoComRotulo } from "@/lib/certificadoFields";
import { buildCertificadoHtml } from "@/lib/certificadoTemplate";

interface Props {
  camposIniciais: CertificadoCampos;
  avisos: string[];
}

const CAMPOS_LONGOS: CampoComRotulo[] = [
  "1.4_endereco",
  "2.3_enderecoCliente",
  "3.2_enderecoTratamento",
  "3.6_quantidade",
];

const CHAVES_EDITAVEIS: CampoComRotulo[] = LINHAS.flatMap((linha) => {
  if (linha.tipo === "campos") return [...linha.campos];
  if (linha.tipo === "cinza") return [linha.campo];
  return [];
});

export function CertificatePreview({ camposIniciais, avisos }: Props) {
  const [campos, setCampos] = useState<CertificadoCampos>(camposIniciais);
  const [copiado, setCopiado] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => buildCertificadoHtml(campos), [campos]);

  function setCampo(key: keyof CertificadoCampos, value: string) {
    setCampos((prev) => ({ ...prev, [key]: value }));
    setCopiado(false);
  }

  async function copiar() {
    const texto = docRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([texto], { type: "text/plain" }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(texto);
    }
    setCopiado(true);
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
        <label className="text-sm font-medium text-zinc-700">Número do Certificado</label>
        <input
          className="border rounded px-3 py-2 text-sm max-w-xs bg-white text-zinc-900"
          value={campos.numeroCertificado}
          onChange={(e) => setCampo("numeroCertificado", e.target.value)}
          placeholder="ex: 1480/2026"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={copiar}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm"
        >
          Copiar formatado
        </button>
        {copiado && (
          <span className="text-green-700 text-sm">
            Copiado! No editor do SEI, selecione tudo (Ctrl+A) e cole (Ctrl+V).
          </span>
        )}
      </div>

      <div className="border bg-zinc-200 p-4 overflow-x-auto">
        <div
          ref={docRef}
          className="sei-doc"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <details className="border rounded-md bg-white text-zinc-900">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          Editar campos
        </summary>
        <div className="grid gap-3 p-4 border-t">
          {CHAVES_EDITAVEIS.map((key) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{ROTULOS[key]}</span>
              {CAMPOS_LONGOS.includes(key) ? (
                <textarea
                  rows={2}
                  className="border rounded px-2 py-1 text-sm"
                  value={campos[key] ?? ""}
                  onChange={(e) => setCampo(key, e.target.value)}
                />
              ) : (
                <input
                  className="border rounded px-2 py-1 text-sm"
                  value={campos[key] ?? ""}
                  onChange={(e) => setCampo(key, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
