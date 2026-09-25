"use client";

import { useState, type FormEvent } from "react";
import { CertificatePreview } from "@/components/CertificatePreview";
import { FileDrop } from "@/components/FileDrop";
import { Steps } from "@/components/Steps";
import { Topbar } from "@/components/Topbar";
import type { ExtractResult } from "@/lib/types";

export default function Home() {
  const [curvaFile, setCurvaFile] = useState<File | null>(null);
  const [comunicadoFile, setComunicadoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ExtractResult | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [rodada, setRodada] = useState(0);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!curvaFile || !comunicadoFile) {
      setErro("Envie os dois PDFs: a curva de tratamento e o comunicado.");
      return;
    }
    setLoading(true);
    setErro(null);

    const formData = new FormData();
    formData.append("curva", curvaFile);
    formData.append("comunicado", comunicadoFile);

    try {
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Erro ao processar os arquivos.");
      } else {
        setResultado(data as ExtractResult);
        setCopiado(false);
        setRodada((n) => n + 1);
      }
    } catch {
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function novoCertificado() {
    setResultado(null);
    setCurvaFile(null);
    setComunicadoFile(null);
    setCopiado(false);
    setErro(null);
  }

  return (
    <>
      <Topbar />
      <main>
        <Steps atual={!resultado ? 1 : copiado ? 3 : 2} />

        {!resultado ? (
          <form className="view" onSubmit={onSubmit}>
            <p className="lead">
              Envie a <b>curva de tratamento</b> (PDF do equipamento) e o <b>comunicado de tratamento</b> do
              mesmo serviço. Os dados do certificado são preenchidos automaticamente — você só confere e cola
              no SEI.
            </p>

            <div className="drops">
              <FileDrop
                titulo="Curva de tratamento"
                dica="Arraste o PDF aqui ou clique para escolher (ex.: 1495 MANN 189.pdf)"
                arquivo={curvaFile}
                onArquivo={setCurvaFile}
              />
              <FileDrop
                titulo="Comunicado de tratamento"
                dica="Arraste o PDF aqui ou clique para escolher (ex.: COMUNICADO 1559-2026…pdf)"
                arquivo={comunicadoFile}
                onArquivo={setComunicadoFile}
              />
            </div>

            {erro && (
              <div className="alert-box critical" role="alert">
                <h4>Não foi possível continuar</h4>
                <ul>
                  <li>{erro}</li>
                </ul>
              </div>
            )}

            <div className="actions">
              <button type="submit" className="btn primary lg" disabled={loading}>
                {loading ? "Lendo os PDFs…" : "Extrair dados"}
              </button>
              <span className="hint">
                O número do certificado é deduzido do nome do arquivo da curva (ex.: “1495” em
                “1495 MANN 189.pdf”).
              </span>
            </div>
          </form>
        ) : (
          <CertificatePreview
            key={rodada}
            camposIniciais={resultado.campos}
            avisos={resultado.avisos}
            clienteEncontrado={resultado.clienteEncontrado}
            onNovo={novoCertificado}
            onCopiado={() => setCopiado(true)}
          />
        )}
      </main>

      <footer className="note">
        MANN Tratamentos Fitossanitários · EXATA Ambiental — os PDFs são usados apenas para extrair os
        dados e não ficam armazenados. Confira sempre o certificado antes de assinar no SEI.
      </footer>
    </>
  );
}
