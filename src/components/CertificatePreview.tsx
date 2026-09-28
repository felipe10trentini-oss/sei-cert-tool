"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CertificadoCampos, Divergencia } from "@/lib/types";
import { cabecalhoSenha, useSenhaEquipe } from "@/lib/senhaEquipe";
import { LINHAS, ROTULOS, type CampoComRotulo } from "@/lib/certificadoFields";
import { buildCertificadoHtml } from "@/lib/certificadoTemplate";
import { linhaParaTsv, type MapaKey, type MapaLinha } from "@/lib/mapaPlanilha";
import { LinhaMapaCard } from "./LinhaMapaCard";

interface Props {
  camposIniciais: CertificadoCampos;
  avisos: string[];
  clienteEncontrado: boolean;
  mapa?: MapaLinha;
  divergencias?: Divergencia[];
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

export function CertificatePreview({
  camposIniciais,
  avisos,
  clienteEncontrado,
  mapa,
  divergencias = [],
  onNovo,
  onCopiado,
}: Props) {
  const [campos, setCampos] = useState<CertificadoCampos>(camposIniciais);
  const erros = divergencias.filter((d) => d.nivel === "erro");
  const atencoes = divergencias.filter((d) => d.nivel === "atencao");
  const [ciente, setCiente] = useState(false);
  const trava = erros.length > 0 && !ciente;
  const { senha, definir } = useSenhaEquipe();
  const [pedirSenha, setPedirSenha] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [registrado, setRegistrado] = useState(false);
  const [erroRegistro, setErroRegistro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [linhaMapa, setLinhaMapa] = useState<MapaLinha | undefined>(mapa);
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

  /** Registra a emissão no histórico (usado para acusar certificado/comunicado repetido). */
  async function registrar(senhaUsada: string) {
    if (!linhaMapaAtual) return;
    setErroRegistro(null);
    try {
      const res = await fetch("/api/historico", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabecalhoSenha(senhaUsada) },
        body: JSON.stringify({ linha: linhaMapaAtual }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        definir(null);
        setPedirSenha(true);
        setErroRegistro("Senha da equipe incorreta.");
      } else if (!res.ok) {
        setErroRegistro(data.error ?? "Não foi possível registrar no histórico.");
      } else {
        definir(senhaUsada);
        setPedirSenha(false);
        setRegistrado(true);
      }
    } catch {
      setErroRegistro("Não foi possível conectar ao servidor para registrar no histórico.");
    }
  }

  function bloqueado(): boolean {
    if (!trava) return false;
    setToast("Há divergências: marque “Conferi as divergências” para poder copiar.");
    return true;
  }

  async function copiar() {
    if (bloqueado()) return;
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
      if (!registrado) {
        if (senha) void registrar(senha);
        else setPedirSenha(true);
      }
    } catch {
      setToast("Não foi possível copiar. Permita o acesso à área de transferência e tente de novo.");
    }
  }

  // O nº do certificado é editado no topo da tela: a linha do relatório acompanha.
  const linhaMapaAtual = linhaMapa ? { ...linhaMapa, numCertificado: campos.numeroCertificado } : undefined;

  async function copiarLinhaRelatorio() {
    if (!linhaMapaAtual || bloqueado()) return;
    try {
      await navigator.clipboard.writeText(linhaParaTsv(linhaMapaAtual));
      setToast("Linha copiada! Cole na coluna A da próxima linha vazia da aba TÉRMICO.");
    } catch {
      setToast("Não foi possível copiar. Permita o acesso à área de transferência e tente de novo.");
    }
  }

  function ajustarLinha(key: MapaKey, valor: string) {
    setLinhaMapa((l) => (l ? { ...l, [key]: valor } : l));
  }

  const termino = campos["3.14_horarioTermino"];

  return (
    <div className="view">
      {erros.length > 0 && (
        <div className="alert-box critical" role="alert">
          <h4>Divergências encontradas — confira antes de copiar</h4>
          <ul className="diverg">
            {erros.map((d, i) => (
              <li key={i}>
                <b>{d.campo}</b> — {d.detalhe}
                <span className="diverg-lados mono">
                  {(d.rotulos ?? ["Comunicado", "Curva"])[0]}: {d.comunicado}
                  <br />
                  {(d.rotulos ?? ["Comunicado", "Curva"])[1]}: {d.curva}
                </span>
              </li>
            ))}
          </ul>
          <label className="ciente">
            <input type="checkbox" checked={ciente} onChange={(e) => setCiente(e.target.checked)} />
            Conferi as divergências e quero continuar mesmo assim
          </label>
        </div>
      )}

      {atencoes.length > 0 && (
        <div className="alert-box">
          <h4>Atenção</h4>
          <ul className="diverg">
            {atencoes.map((d, i) => (
              <li key={i}>
                <b>{d.campo}</b> — {d.detalhe}
                <span className="diverg-lados mono">
                  {(d.rotulos ?? ["Comunicado", "Curva"])[0]}: {d.comunicado} · {(d.rotulos ?? ["Comunicado", "Curva"])[1]}: {d.curva}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
        {linhaMapaAtual && (
          <button type="button" className="btn lg" onClick={copiarLinhaRelatorio} disabled={trava}>
            Copiar linha do relatório
          </button>
        )}
        <button type="button" className="btn primary lg" onClick={copiar} disabled={trava}>
          Copiar certificado
        </button>
      </div>

      {pedirSenha && !registrado && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="field" style={{ flex: 1, minWidth: 220 }}>
              <label htmlFor="senha-historico">Registrar no histórico — senha da equipe</label>
              <input
                id="senha-historico"
                type="password"
                autoComplete="current-password"
                value={senhaDigitada}
                onChange={(e) => setSenhaDigitada(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn primary"
              disabled={!senhaDigitada}
              onClick={() => registrar(senhaDigitada)}
            >
              Registrar
            </button>
          </div>
          <p className="hint">
            O histórico avisa quando um certificado ou comunicado já foi usado antes. Você pode ignorar; a
            cópia já foi feita.
          </p>
          {erroRegistro && <p style={{ color: "var(--bad)", fontSize: 13, margin: "6px 0 0" }}>{erroRegistro}</p>}
        </div>
      )}
      {registrado && (
        <p className="hint" style={{ margin: "0 0 14px" }}>
          <span className="badge pago">Registrado no histórico</span> Se este certificado ou comunicado for
          usado de novo, o sistema avisa.
        </p>
      )}
      {erroRegistro && !pedirSenha && (
        <p style={{ color: "var(--bad)", fontSize: 13, margin: "0 0 14px" }}>{erroRegistro}</p>
      )}

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
        <button type="button" className="btn primary lg" onClick={copiar} disabled={trava}>
          Copiar certificado
        </button>
      </div>

      {linhaMapaAtual && (
        <LinhaMapaCard
          linha={linhaMapaAtual}
          onAjustar={ajustarLinha}
          onCopiar={copiarLinhaRelatorio}
          desabilitado={trava}
        />
      )}

      {toast && (
        <div id="toast-host" role="status">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}
