"use client";

import { COLUNAS_MAPA, type MapaKey, type MapaLinha } from "@/lib/mapaPlanilha";

interface Props {
  linha: MapaLinha;
  onAjustar: (key: MapaKey, valor: string) => void;
  onCopiar: () => void;
}

// Campos que os PDFs não trazem com certeza; o resto sai pronto da extração.
const AJUSTES: MapaKey[] = [
  "dataComunicado",
  "processoComunicado",
  "local",
  "unidadeTratamento",
  "processoCertificado",
  "dataEmissao",
];

export function LinhaMapaCard({ linha, onAjustar, onCopiar }: Props) {
  return (
    <section>
      <div className="section-title">
        <h2>Linha do relatório do MAPA</h2>
        <p>Aba TÉRMICO, colunas A–Z, na mesma ordem da planilha.</p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-grid tres">
          {AJUSTES.map((key) => {
            const col = COLUNAS_MAPA.find((c) => c.key === key)!;
            return (
              <div className="field" key={key}>
                <label htmlFor={`mapa-${key}`}>{col.titulo}</label>
                <input
                  id={`mapa-${key}`}
                  type="text"
                  value={linha[key]}
                  onChange={(e) => onAjustar(key, e.target.value)}
                  placeholder={key === "processoCertificado" ? "deixe em branco e preencha depois" : ""}
                />
              </div>
            );
          })}
        </div>
        <p className="hint">
          O nº do processo do certificado (coluna Y) só existe depois que o SEI gera o certificado: deixe em branco
          aqui e complete na sua planilha.
        </p>
      </div>

      <div className="table-wrap" style={{ marginBottom: 14 }}>
        <table className="dados">
          <thead>
            <tr>
              {COLUNAS_MAPA.map((c) => (
                <th key={c.key}>{c.titulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {COLUNAS_MAPA.map((c) => (
                <td key={c.key}>{linha[c.key] || "—"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button type="button" className="btn primary lg" onClick={onCopiar}>
          Copiar linha do relatório
        </button>
        <span className="hint">Cole na coluna A da próxima linha vazia da aba TÉRMICO.</span>
      </div>
    </section>
  );
}
