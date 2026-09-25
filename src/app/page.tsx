"use client";

import { useState, FormEvent } from "react";
import { CertificatePreview } from "@/components/CertificatePreview";
import type { ExtractResult } from "@/lib/types";

export default function Home() {
  const [curvaFile, setCurvaFile] = useState<File | null>(null);
  const [comunicadoFile, setComunicadoFile] = useState<File | null>(null);
  const [numeroCertificado, setNumeroCertificado] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ExtractResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!curvaFile || !comunicadoFile) {
      setErro("Selecione o PDF da curva e o PDF do comunicado.");
      return;
    }
    setLoading(true);
    setErro(null);
    setResultado(null);

    const formData = new FormData();
    formData.append("curva", curvaFile);
    formData.append("comunicado", comunicadoFile);
    formData.append("numeroCertificado", numeroCertificado);

    try {
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Erro ao processar os arquivos.");
      } else {
        setResultado(data as ExtractResult);
      }
    } catch {
      setErro("Não foi possível conectar à API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <main className="max-w-3xl mx-auto flex flex-col gap-8">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Preenchimento do Certificado TFQ-HT
          </h1>
          <p className="text-zinc-600 text-sm mt-1">
            Envie a curva de tratamento (Digisystem CRG08) e o Comunicado de Tratamento em PDF.
            Os dados do certificado são extraídos automaticamente — confira e ajuste antes de
            copiar para o SEI.
          </p>
        </header>

        <form onSubmit={onSubmit} className="bg-white border rounded-md p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              Curva de tratamento (PDF do Digisystem, qualquer um dos 2 layouts)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setCurvaFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              Comunicado de Tratamento (PDF)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setComunicadoFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              Número do Certificado (opcional — se vazio, tenta deduzir do nome do arquivo da curva)
            </label>
            <input
              type="text"
              value={numeroCertificado}
              onChange={(e) => setNumeroCertificado(e.target.value)}
              placeholder="ex: 1480/2026"
              className="border rounded px-3 py-2 text-sm max-w-xs"
            />
          </div>

          {erro && <p className="text-red-600 text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="self-start bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md text-sm"
          >
            {loading ? "Extraindo..." : "Extrair dados"}
          </button>
        </form>

        {resultado && (
          <CertificatePreview
            camposIniciais={resultado.campos}
            avisos={resultado.avisos}
          />
        )}
      </main>
    </div>
  );
}
