"use client";

import { useEffect, useState } from "react";
import { FileDrop } from "@/components/FileDrop";
import { PortaoSenha } from "@/components/PortaoSenha";
import { cabecalhoSenha } from "@/lib/senhaEquipe";

interface Resumo {
  totalNaPlanilha: number;
  novos: { nome: string; cnpj: string }[];
  atualizados: { nome: string; cnpj: string; campos: string[] }[];
  iguais: number;
  ignoradas: number;
  ausentesNaPlanilha: number;
  aplicado: boolean;
}

const NOME_CAMPO: Record<string, string> = {
  apelido: "apelido",
  nome: "razão social",
  cnpj: "CNPJ",
  endereco: "endereço",
  email: "e-mail",
  telefone: "telefone",
  endereco_escritorio: "endereço do escritório",
};

function Clientes({ senha, sair }: { senha: string; sair: () => void }) {
  const [total, setTotal] = useState<number | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [trabalhando, setTrabalhando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarTotal() {
    try {
      const res = await fetch("/api/clientes", { cache: "no-store" });
      const data = await res.json();
      setTotal(res.ok ? data.total : null);
    } catch {
      setTotal(null);
    }
  }

  useEffect(() => {
    void carregarTotal();
  }, []);

  async function enviar(modo: "previa" | "aplicar") {
    if (!arquivo) return;
    setTrabalhando(true);
    setErro(null);
    const form = new FormData();
    form.append("arquivo", arquivo);
    form.append("modo", modo);
    try {
      const res = await fetch("/api/clientes/importar", {
        method: "POST",
        headers: cabecalhoSenha(senha),
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) sair();
      else if (!res.ok) setErro(data.error ?? "Não foi possível processar a planilha.");
      else {
        setResumo(data as Resumo);
        if (modo === "aplicar") void carregarTotal();
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setTrabalhando(false);
    }
  }

  function trocarArquivo(f: File | null) {
    setArquivo(f);
    setResumo(null);
    setErro(null);
  }

  const mudancas = resumo ? resumo.novos.length + resumo.atualizados.length : 0;

  return (
    <div className="view">
      <p className="lead">
        Envie a planilha de clientes (aba <b>DADOS</b>, com as colunas Cliente, Nome, CNPJ, Endereço, E-mail,
        Telefone e Endereço escritório). O site compara pelo <b>CNPJ</b>: cadastra os novos e atualiza os que
        mudaram. Nenhum cliente é apagado.
      </p>

      <div className="grid kpis">
        <div className="card">
          <div className="kpi-label">Clientes cadastrados</div>
          <div className="kpi-value">{total ?? "—"}</div>
          <div className="kpi-sub">usados para preencher telefone, e-mail e endereço no certificado</div>
        </div>
      </div>

      <div className="drops" style={{ gridTemplateColumns: "1fr" }}>
        <FileDrop
          titulo="Planilha de clientes"
          dica="Arraste o arquivo .xlsx aqui ou clique para escolher (até 4 MB)"
          arquivo={arquivo}
          onArquivo={trocarArquivo}
          accept=".xlsx"
          aceita={(f) => /\.xlsx$/i.test(f.name)}
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

      <div className="actions" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className="btn primary lg"
          disabled={!arquivo || trabalhando}
          onClick={() => enviar("previa")}
        >
          {trabalhando && !resumo ? "Lendo a planilha…" : "Ver o que vai mudar"}
        </button>
        <button type="button" className="btn" onClick={sair}>
          Sair
        </button>
      </div>

      {resumo && (
        <div className="view">
          <div className="grid kpis">
            <div className="card">
              <div className="kpi-label">Novos</div>
              <div className="kpi-value">{resumo.novos.length}</div>
            </div>
            <div className="card">
              <div className="kpi-label">Atualizados</div>
              <div className="kpi-value">{resumo.atualizados.length}</div>
            </div>
            <div className="card">
              <div className="kpi-label">Sem mudança</div>
              <div className="kpi-value">{resumo.iguais}</div>
            </div>
            <div className="card">
              <div className="kpi-label">Ignorados (sem CNPJ válido)</div>
              <div className="kpi-value">{resumo.ignoradas}</div>
              <div className="kpi-sub">
                {resumo.ausentesNaPlanilha} do cadastro não estão nesta planilha (mantidos)
              </div>
            </div>
          </div>

          {resumo.novos.length > 0 && (
            <>
              <div className="section-title">
                <h2>Novos clientes</h2>
              </div>
              <div className="table-wrap" style={{ marginBottom: 14 }}>
                <table className="dados">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CNPJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumo.novos.map((c) => (
                      <tr key={c.cnpj}>
                        <td>{c.nome}</td>
                        <td className="mono">{c.cnpj}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {resumo.atualizados.length > 0 && (
            <>
              <div className="section-title">
                <h2>Clientes que serão atualizados</h2>
              </div>
              <div className="table-wrap" style={{ marginBottom: 14 }}>
                <table className="dados">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CNPJ</th>
                      <th>O que mudou</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumo.atualizados.map((c) => (
                      <tr key={c.cnpj}>
                        <td>{c.nome}</td>
                        <td className="mono">{c.cnpj}</td>
                        <td>{c.campos.map((k) => NOME_CAMPO[k] ?? k).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {resumo.aplicado ? (
            <div className="alert-box" style={{ borderColor: "var(--good)", background: "var(--good-bg)" }}>
              <h4>Cadastro atualizado</h4>
              <ul>
                <li>
                  {resumo.novos.length} novo(s) e {resumo.atualizados.length} atualizado(s).
                </li>
              </ul>
            </div>
          ) : mudancas === 0 ? (
            <div className="alert-box">
              <h4>Nada a fazer</h4>
              <ul>
                <li>O cadastro já está igual à planilha.</li>
              </ul>
            </div>
          ) : (
            <div className="actions">
              <button
                type="button"
                className="btn primary lg"
                disabled={trabalhando}
                onClick={() => enviar("aplicar")}
              >
                {trabalhando ? "Aplicando…" : `Aplicar ${mudancas} mudança(s)`}
              </button>
              <span className="hint">Confira a lista acima antes de aplicar.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PaginaClientes() {
  return (
    <PortaoSenha titulo="Cadastro de clientes">
      {(senha, sair) => <Clientes senha={senha} sair={sair} />}
    </PortaoSenha>
  );
}
