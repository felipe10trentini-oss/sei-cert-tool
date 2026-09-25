"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CertificadoCampos } from "@/lib/types";
import { LINHAS, ROTULOS, type CampoComRotulo } from "@/lib/certificadoFields";
import { buildCertificadoHtml } from "@/lib/certificadoTemplate";

interface Props {
  camposIniciais: CertificadoCampos;
  avisos: string[];
  clienteEncontrado: boolean;
  onNovo: () => void;
  onCopiado: () => void;
}

const CAMPOS_LONGOS: CampoComRotulo[] = [
  "1.4_endereco",
  "2.3_enderecoCliente",
  "3.2_enderecoTratamento",
  "3.4_descricaoProduto",
  "3.6_quantidade",
];

const CHAVES_EDITAVEIS: CampoComRotulo[] = LINHAS.flatMap((linha) => {
  if (linha.tipo === "campos") return [...linha.campos];
  if (linha.tipo === "cinza") return [linha.campo];
  return [];
});

export function CertificatePreview({ camposIniciais, avisos, clienteEncontrado, onNovo, onCopiado }: Props) {
  const [campos, setCampos] = useState<CertificadoCampos>(camposIniciais);
  const [editando, setEditando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => buildCertificadoHtml(campos), [campos]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  function setCampo(key: keyof CertificadoCampos, value: string) {
    setCampos((prev) => ({ ...prev, [key]: value }));
  }

  async function copiar() {
    const texto = docRef.current?.innerText ?? "";
    try {
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
      setToast("Copiado! No editor do SEI: Ctrl+A e Ctrl+V.");
      onCopiado();
    } catch {
      setToast("Não foi possível copiar. Permita o acesso à área de transferência e tente de novo.");
    }
  }

  const termino = campos["3.14_horarioTermino"];

  return (
    <div className="view">
      {avisos.length > 0 && (
        <div className="alert-box">
          <h4>Confira antes de copiar</h4>
          <ul>
            {avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid kpis">
        <div className="card">
          <div className="kpi-label">Cliente (tomador)</div>
          <div className="kpi-value text">{campos["2.1_razaoSocialCliente"] || "—"}</div>
          <div className="kpi-sub">
            {campos["2.2_cnpjCliente"] || "CNPJ não identificado"}{" "}
            <span className={`badge ${clienteEncontrado ? "pago" : "pendente"}`}>
              {clienteEncontrado ? "no cadastro" : "fora do cadastro"}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Comunicado</div>
          <div className="kpi-value">{campos["3.1_numeroComunicado"] || "—"}</div>
          <div className="kpi-sub">{campos["3.4_descricaoProduto"] || " "}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Lote / ciclo</div>
          <div className="kpi-value">{campos["3.7_lote"] || "—"}</div>
          <div className="kpi-sub">{campos["3.15_temperaturaDuracao"] || " "}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Tratamento</div>
          <div className="kpi-value text">{campos["3.11_dataInicio"] || "—"}</div>
          <div className="kpi-sub mono">
            {campos["3.12_horarioInicio"] || "?"} → {termino || "?"}
          </div>
        </div>
      </div>

      <div className="card ultima-troca-card">
        <div className="ultima-troca-label">Como colar no SEI</div>
        <ol className="howto">
          <li>
            <b>1</b>Abra o certificado no SEI e clique dentro do editor
          </li>
          <li>
            <b>2</b>Selecione tudo com Ctrl+A
          </li>
          <li>
            <b>3</b>Cole com Ctrl+V
          </li>
          <li>
            <b>4</b>Confira e assine no SEI
          </li>
        </ol>
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="num-cert">Nº do certificado</label>
          <input
            id="num-cert"
            type="text"
            value={campos.numeroCertificado}
            onChange={(e) => setCampo("numeroCertificado", e.target.value)}
            placeholder="ex: 1480/2026"
          />
        </div>
        <div className="spacer" />
        <button type="button" className="btn" onClick={() => setEditando((v) => !v)}>
          {editando ? "Fechar edição" : "Editar campos"}
        </button>
        <button type="button" className="btn" onClick={onNovo}>
          Novo certificado
        </button>
        <button type="button" className="btn primary lg" onClick={copiar}>
          Copiar formatado
        </button>
      </div>

      {editando && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="form-grid">
            {CHAVES_EDITAVEIS.map((key) => (
              <div key={key} className={`field${CAMPOS_LONGOS.includes(key) ? " full" : ""}`}>
                <label htmlFor={`f-${key}`}>{ROTULOS[key]}</label>
                {CAMPOS_LONGOS.includes(key) ? (
                  <textarea
                    id={`f-${key}`}
                    rows={2}
                    value={campos[key] ?? ""}
                    onChange={(e) => setCampo(key, e.target.value)}
                  />
                ) : (
                  <input
                    id={`f-${key}`}
                    type="text"
                    value={campos[key] ?? ""}
                    onChange={(e) => setCampo(key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-title">
        <h2>Prévia do certificado</h2>
        <p>É exatamente o que será colado no SEI.</p>
      </div>
      <div className="paper-wrap">
        <div ref={docRef} className="sei-doc" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <div className="toolbar" style={{ marginTop: 18, justifyContent: "flex-end" }}>
        <button type="button" className="btn primary lg" onClick={copiar}>
          Copiar formatado
        </button>
      </div>

      {toast && (
        <div id="toast-host" role="status">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}
