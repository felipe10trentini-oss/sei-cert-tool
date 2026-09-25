"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PortaoSenha } from "@/components/PortaoSenha";
import { COLUNAS_MAPA, cabecalhoTsv, linhaParaTsv, type MapaLinha } from "@/lib/mapaPlanilha";
import { cabecalhoSenha } from "@/lib/senhaEquipe";

interface Item {
  id: number;
  linha: MapaLinha;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const SQL_TABELA = `create table if not exists certificados_emitidos (
  id bigint generated always as identity primary key,
  numero_certificado text not null unique,
  data_tratamento date,
  linha jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists certificados_emitidos_data_idx on certificados_emitidos (data_tratamento);
alter table certificados_emitidos enable row level security;`;

function Planilha({ senha, sair }: { senha: string; sair: () => void }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tabelaAusente, setTabelaAusente] = useState(false);
  const [editando, setEditando] = useState<Item | null>(null);
  const [comCabecalho, setComCabecalho] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    setTabelaAusente(false);
    try {
      const res = await fetch(`/api/planilha?ano=${ano}&mes=${mes}`, {
        headers: cabecalhoSenha(senha),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) sair();
      else if (data.error === "tabela_ausente") setTabelaAusente(true);
      else if (!res.ok) setErro(data.error ?? "Não foi possível carregar a planilha.");
      else setItens(data.itens);
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }, [ano, mes, senha, sair]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(t);
  }, [aviso]);

  const tsv = useMemo(
    () => [...(comCabecalho ? [cabecalhoTsv()] : []), ...itens.map((i) => linhaParaTsv(i.linha))].join("\n"),
    [itens, comCabecalho]
  );

  async function copiarTudo() {
    try {
      await navigator.clipboard.writeText(tsv);
      setAviso(`${itens.length} linha(s) copiada(s). Cole na coluna A da próxima linha vazia da aba TÉRMICO.`);
    } catch {
      setAviso("Não foi possível copiar. Permita o acesso à área de transferência.");
    }
  }

  async function salvarEdicao() {
    if (!editando) return;
    const res = await fetch(`/api/planilha?id=${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...cabecalhoSenha(senha) },
      body: JSON.stringify({ linha: editando.linha }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAviso(data.error ?? "Não foi possível salvar.");
      return;
    }
    setEditando(null);
    setAviso("Linha atualizada.");
    void carregar();
  }

  async function excluir(item: Item) {
    if (!confirm(`Remover o certificado ${item.linha.numCertificado} da planilha?`)) return;
    const res = await fetch(`/api/planilha?id=${item.id}`, { method: "DELETE", headers: cabecalhoSenha(senha) });
    if (res.ok) {
      setAviso("Linha removida.");
      void carregar();
    } else {
      setAviso("Não foi possível remover.");
    }
  }

  const anos = Array.from({ length: 4 }, (_, i) => hoje.getFullYear() - i);
  const semProcesso = itens.filter((i) => !i.linha.processoCertificado).length;

  return (
    <div className="view">
      <p className="lead">
        Cada certificado salvo na tela de emissão vira uma linha da aba <b>TÉRMICO</b> do MAPA. No fim do mês,
        escolha o mês, copie as linhas e cole na planilha principal.
      </p>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="sel-mes">Mês</label>
          <select id="sel-mes" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 100 }}>
          <label htmlFor="sel-ano">Ano</label>
          <select id="sel-ano" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="spacer" />
        <label className="hint" style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 0 }}>
          <input type="checkbox" checked={comCabecalho} onChange={(e) => setComCabecalho(e.target.checked)} />
          incluir cabeçalho
        </label>
        <button type="button" className="btn primary lg" onClick={copiarTudo} disabled={itens.length === 0}>
          Copiar {itens.length || ""} linha(s)
        </button>
        <button type="button" className="btn" onClick={sair}>
          Sair
        </button>
      </div>

      {aviso && (
        <p className="hint" role="status" style={{ fontSize: 13, marginBottom: 10 }}>
          {aviso}
        </p>
      )}

      {semProcesso > 0 && !carregando && (
        <div className="alert-box">
          <h4>Antes de copiar</h4>
          <ul>
            <li>
              {semProcesso} linha(s) ainda sem o nº do processo do certificado (coluna Y). Use “Editar” para preencher.
            </li>
          </ul>
        </div>
      )}

      {tabelaAusente && (
        <div className="alert-box critical">
          <h4>Falta criar a tabela no Supabase</h4>
          <ul>
            <li>
              No painel do Supabase abra <b>SQL Editor → New query</b>, cole o SQL abaixo e clique em <b>Run</b>.
            </li>
          </ul>
          <pre className="mono" style={{ whiteSpace: "pre-wrap", fontSize: 12, margin: "10px 0 0" }}>
            {SQL_TABELA}
          </pre>
        </div>
      )}
      {erro && (
        <div className="alert-box critical" role="alert">
          <h4>Erro</h4>
          <ul>
            <li>{erro}</li>
          </ul>
        </div>
      )}

      <div className="table-wrap">
        <table className="dados">
          <thead>
            <tr>
              <th>Certificado</th>
              <th>Data</th>
              <th>Tomador</th>
              <th>Produto</th>
              <th>Volumes</th>
              <th>Ciclo</th>
              <th>Processo do certificado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  Carregando…
                </td>
              </tr>
            ) : itens.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  Nenhum certificado salvo em {MESES[mes - 1]} de {ano}.
                </td>
              </tr>
            ) : (
              itens.map((i) => (
                <tr key={i.id}>
                  <td className="mono">{i.linha.numCertificado}</td>
                  <td>{i.linha.dataTratamento}</td>
                  <td>{i.linha.tomador}</td>
                  <td>{i.linha.produto}</td>
                  <td className="mono">{i.linha.volumes}</td>
                  <td className="mono">{i.linha.ciclo}</td>
                  <td className="mono">
                    {i.linha.processoCertificado || <span className="badge pendente">falta preencher</span>}
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setEditando({ ...i, linha: { ...i.linha } })}
                    >
                      Editar
                    </button>
                    <button type="button" className="btn btn-sm danger" onClick={() => excluir(i)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="hint" style={{ marginTop: 8 }}>
        As linhas saem ordenadas por data do tratamento e número do certificado.
      </p>

      {editando && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Editar linha — {editando.linha.numCertificado}</h3>
            <div className="form-grid tres">
              {COLUNAS_MAPA.map((c) => (
                <div className="field" key={c.key}>
                  <label htmlFor={`e-${c.key}`}>{c.titulo}</label>
                  <input
                    id={`e-${c.key}`}
                    type="text"
                    value={editando.linha[c.key]}
                    onChange={(e) =>
                      setEditando((cur) =>
                        cur ? { ...cur, linha: { ...cur.linha, [c.key]: e.target.value } } : cur
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button type="button" className="btn primary" onClick={salvarEdicao}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaginaPlanilha() {
  return (
    <PortaoSenha titulo="Planilha de controle do MAPA">
      {(senha, sair) => <Planilha senha={senha} sair={sair} />}
    </PortaoSenha>
  );
}
