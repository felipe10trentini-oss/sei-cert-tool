"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COLUNAS_MAPA, linhaParaTsv, type MapaKey, type MapaLinha } from "@/lib/mapaPlanilha";
import { cabecalhoSenha, useSenhaEquipe } from "@/lib/senhaEquipe";

interface Props {
  linhaInicial: MapaLinha;
  numeroCertificado: string;
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

export function LinhaMapaCard({ linhaInicial, numeroCertificado }: Props) {
  const [linha, setLinha] = useState<MapaLinha>(linhaInicial);
  const [status, setStatus] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pedirSenha, setPedirSenha] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const { senha, definir } = useSenhaEquipe();

  // O número do certificado é editado no topo da tela: a linha acompanha.
  const linhaAtual: MapaLinha = { ...linha, numCertificado: numeroCertificado };

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(t);
  }, [status]);

  function ajustar(key: MapaKey, valor: string) {
    setLinha((l) => ({ ...l, [key]: valor }));
    setSalvo(false);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(linhaParaTsv(linhaAtual));
      setStatus("Linha copiada! Cole na primeira coluna (A) da próxima linha vazia da aba TÉRMICO.");
    } catch {
      setStatus("Não foi possível copiar. Permita o acesso à área de transferência.");
    }
  }

  async function salvar(senhaUsada: string) {
    setSalvando(true);
    try {
      const res = await fetch("/api/planilha", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabecalhoSenha(senhaUsada) },
        body: JSON.stringify({ linha: linhaAtual }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        definir(null);
        setPedirSenha(true);
        setStatus("Senha da equipe incorreta.");
      } else if (data.error === "tabela_ausente") {
        setStatus("A tabela da planilha ainda não foi criada no Supabase (veja o passo a passo enviado).");
      } else if (!res.ok) {
        setStatus(data.error ?? "Não foi possível salvar.");
      } else {
        definir(senhaUsada);
        setPedirSenha(false);
        setSalvo(true);
        setStatus("Linha salva na planilha do mês.");
      }
    } catch {
      setStatus("Não foi possível conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  }

  function aoClicarSalvar() {
    if (senha) void salvar(senha);
    else setPedirSenha(true);
  }

  return (
    <section>
      <div className="section-title">
        <h2>Planilha de controle do MAPA</h2>
        <p>Linha da aba TÉRMICO, na mesma ordem das colunas A–Z.</p>
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
                  value={linhaAtual[key]}
                  onChange={(e) => ajustar(key, e.target.value)}
                  placeholder={key === "processoCertificado" ? "vem do SEI, ex.: 21034.037010/2026-21" : ""}
                />
              </div>
            );
          })}
        </div>
        <p className="hint">
          O nº do processo do certificado só existe depois que o SEI cria o processo; se ainda não tiver, deixe em
          branco e complete depois na aba Planilha MAPA.
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
                <td key={c.key}>{linhaAtual[c.key] || "—"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {pedirSenha && !senha && (
        <div className="toolbar">
          <div className="field">
            <label htmlFor="senha-salvar">Senha da equipe</label>
            <input
              id="senha-salvar"
              type="password"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
            />
          </div>
          <button type="button" className="btn primary" disabled={!senhaDigitada || salvando} onClick={() => salvar(senhaDigitada)}>
            Confirmar e salvar
          </button>
        </div>
      )}

      <div className="actions">
        <button type="button" className="btn primary lg" onClick={copiar}>
          Copiar linha
        </button>
        <button type="button" className="btn lg" onClick={aoClicarSalvar} disabled={salvando || salvo}>
          {salvo ? "Salva no mês ✓" : salvando ? "Salvando…" : "Salvar na planilha do mês"}
        </button>
        {salvo && (
          <Link href="/planilha" className="hint" style={{ fontSize: 13 }}>
            Ver a planilha do mês
          </Link>
        )}
        {status && <span className="hint" role="status" style={{ fontSize: 13 }}>{status}</span>}
      </div>
    </section>
  );
}
