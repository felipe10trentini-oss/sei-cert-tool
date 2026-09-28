import type { ComunicadoData, CurvaData, Divergencia } from "./types";

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** "1.000" -> 1000; "135,00" -> 135. */
function numeroBR(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", "."));
}

const PARTES_DATA = ["dia", "mês", "ano"] as const;

/** "24/09/2026" -> [24, 9, 2026] */
function partesData(d: string | null | undefined): [number, number, number] | null {
  const m = (d ?? "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function minutosDoDia(hhmm: string | null | undefined): number | null {
  const m = (hhmm ?? "").match(/(\d{1,2})\s*(?::|h)\s*(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// ---------- descrição do material ----------

const STOPWORDS = new Set(["de", "da", "do", "das", "dos", "e", "com", "a", "o", "madeira"]);

function singular(token: string): string {
  return token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;
}

function limparTexto(texto: string): string {
  return semAcento(texto)
    .replace(/\([^)]*\)/g, " ") // composição do kit: "(composto por 60 bases...)"
    .replace(/\*+/g, " ")
    .replace(/pallet/g, "palete")
    .replace(/\s+/g, " ")
    .trim();
}

/** "135 paletes, 1.000 ripas de fechamento e 20 kits caixas" -> itens com quantidade. */
export function extrairItens(texto: string): Map<string, { qtd: number; rotulo: string }> {
  const t = limparTexto(texto);
  const itens = new Map<string, { qtd: number; rotulo: string }>();
  const re = /(\d[\d.]*(?:,\d+)?)\s+([a-z][a-z ]*?)(?=\s*(?:,|;|\se\s+\d|$))/g;
  for (const m of t.matchAll(re)) {
    // A chave ignora singular/plural ("kit"/"kits"); o rótulo mantém o texto do documento.
    const nome = m[2].split(" ").filter(Boolean).map(singular).join(" ");
    const atual = itens.get(nome);
    itens.set(nome, { qtd: (atual?.qtd ?? 0) + numeroBR(m[1]), rotulo: atual?.rotulo ?? m[2].trim() });
  }
  return itens;
}

function tokens(texto: string): Set<string> {
  return new Set(
    limparTexto(texto)
      .replace(/[^a-z ]/g, " ")
      .split(" ")
      .filter((t) => t && !STOPWORDS.has(t))
      .map(singular)
  );
}

const fmtItens = (itens: Map<string, { qtd: number; rotulo: string }>) =>
  [...itens.values()].map(({ qtd, rotulo }) => `${qtd} ${rotulo}`).join(", ");

// ---------- validações ----------

export function validarComunicadoCurva(args: {
  curva: CurvaData;
  comunicado: ComunicadoData;
  nomeArquivoCurva: string;
  comunicadoCriadoEm: string | null;
}): Divergencia[] {
  const { curva, comunicado, nomeArquivoCurva, comunicadoCriadoEm } = args;
  const d: Divergencia[] = [];

  // 1) Data do tratamento (dia, mês e ano)
  const dc = partesData(comunicado.dataInicioPrevista);
  const dk = partesData(curva.dataInicio);
  if (dc && dk) {
    const difere = PARTES_DATA.filter((_, i) => dc[i] !== dk[i]);
    if (difere.length) {
      d.push({
        nivel: "erro",
        campo: "Data do tratamento",
        comunicado: comunicado.dataInicioPrevista ?? "",
        curva: curva.dataInicio ?? "",
        detalhe: `A data é diferente (${difere.join(", ")}).`,
      });
    }
  } else {
    d.push({
      nivel: "erro",
      campo: "Data do tratamento",
      comunicado: comunicado.dataInicioPrevista ?? "não encontrada",
      curva: curva.dataInicio ?? "não encontrada",
      detalhe: "Não foi possível ler a data em um dos documentos para comparar.",
    });
  }

  // 2) Descrição do material (item por item quando há quantidades)
  const itensCom = extrairItens(comunicado.quantidade ?? "");
  const itensCurva = extrairItens(curva.descricaoCurva ?? "");
  if (curva.descricaoCurva) {
    if (itensCom.size > 0 && itensCurva.size > 0) {
      const nomes = new Set([...itensCom.keys(), ...itensCurva.keys()]);
      const dif: string[] = [];
      for (const n of nomes) {
        const a = itensCom.get(n);
        const b = itensCurva.get(n);
        if (!a && b) dif.push(`"${b.rotulo}" só aparece na curva (${b.qtd})`);
        else if (a && !b) dif.push(`"${a.rotulo}" só aparece no comunicado (${a.qtd})`);
        else if (a && b && a.qtd !== b.qtd) dif.push(`"${a.rotulo}": comunicado ${a.qtd}, curva ${b.qtd}`);
      }
      if (dif.length) {
        d.push({
          nivel: "erro",
          campo: "Descrição do material",
          comunicado: comunicado.quantidade ?? "",
          curva: curva.descricaoCurva,
          detalhe: `Itens diferentes — ${dif.join("; ")}.`,
        });
      }
    } else {
      const a = tokens(comunicado.produto ?? "");
      const b = tokens(curva.descricaoCurva);
      const soCom = [...a].filter((t) => !b.has(t));
      const soCurva = [...b].filter((t) => !a.has(t));
      if (soCom.length || soCurva.length) {
        d.push({
          nivel: "erro",
          campo: "Descrição do material",
          comunicado: comunicado.produto ?? "",
          curva: curva.descricaoCurva,
          detalhe: `Termos diferentes — só no comunicado: ${soCom.join(", ") || "nenhum"}; só na curva: ${soCurva.join(", ") || "nenhum"}.`,
        });
      }
    }
  }

  // 3) Quantidade total (soma do comunicado x "Volume total" da curva)
  const qtdCom = itensCom.size
    ? [...itensCom.values()].reduce((s, i) => s + i.qtd, 0)
    : /^\d[\d.]*$/.test(comunicado.quantidade?.trim() ?? "")
      ? numeroBR(comunicado.quantidade!.trim())
      : null;
  const qtdCurva = curva.volumeTotalPecas ? Number(curva.volumeTotalPecas) : null;
  if (qtdCom !== null && qtdCurva !== null && qtdCom !== qtdCurva) {
    d.push({
      nivel: "erro",
      campo: "Quantidade total",
      comunicado: `${qtdCom} (${itensCom.size ? fmtItens(itensCom) : comunicado.quantidade})`,
      curva: `${qtdCurva} peças (volume total)`,
      detalhe: `A soma das quantidades do comunicado (${qtdCom}) não bate com o volume total da curva (${qtdCurva}).`,
    });
  }

  // 4) Temperatura e duração programadas
  const tempCom = parseInt(comunicado.temperaturaPrevista ?? "", 10);
  const tempCurva = curva.temperaturaTratamento ? Number(curva.temperaturaTratamento) : NaN;
  if (!Number.isNaN(tempCom) && !Number.isNaN(tempCurva) && tempCom !== tempCurva) {
    d.push({
      nivel: "erro",
      campo: "Temperatura do tratamento",
      comunicado: `${tempCom} °C`,
      curva: `${tempCurva} °C`,
      detalhe: "A temperatura do comunicado é diferente da programada no equipamento.",
    });
  }
  const durCom = parseInt(comunicado.duracaoPrevista ?? "", 10);
  if (!Number.isNaN(durCom) && curva.duracaoMin !== null && durCom !== curva.duracaoMin) {
    d.push({
      nivel: "erro",
      campo: "Duração do tratamento",
      comunicado: `${durCom} min`,
      curva: `${curva.duracaoMin} min`,
      detalhe: "A duração do comunicado é diferente da programada no equipamento.",
    });
  }

  // 5) Lote do nome do arquivo x lote lido na curva (pega arquivo trocado)
  const lote = nomeArquivoCurva.match(/^\d+\s+MANN\s+(\d+)/i)?.[1];
  if (lote && curva.loteCiclo && parseInt(lote, 10) !== parseInt(curva.loteCiclo, 10)) {
    d.push({
      nivel: "erro",
      campo: "Lote da curva",
      comunicado: `nome do arquivo: ${lote}`,
      curva: `lido no PDF: ${parseInt(curva.loteCiclo, 10)}`,
      detalhe: "O lote no nome do arquivo não é o mesmo que consta dentro da curva — confira se enviou o arquivo certo.",
    });
  }

  // 6) Curva sem indicação de tratamento concluído
  if (!curva.concluido) {
    d.push({
      nivel: "atencao",
      campo: "Tratamento concluído",
      comunicado: "—",
      curva: "sem “(concluído)”",
      detalhe: "A curva não indica que o tratamento foi concluído.",
    });
  }

  // 7) Comunicado criado depois do dia do tratamento
  const dCriado = partesData(comunicadoCriadoEm);
  if (dCriado && dk) {
    const criado = Date.UTC(dCriado[2], dCriado[1] - 1, dCriado[0]);
    const trat = Date.UTC(dk[2], dk[1] - 1, dk[0]);
    if (criado > trat) {
      d.push({
        nivel: "atencao",
        campo: "Data do comunicado",
        comunicado: `PDF criado em ${comunicadoCriadoEm}`,
        curva: `tratamento em ${curva.dataInicio}`,
        detalhe: "O PDF do comunicado foi gerado depois do dia do tratamento.",
      });
    }
  }

  // 8) Tratamento iniciado antes do horário comunicado
  const prev = minutosDoDia(comunicado.horarioInicioPrevisto);
  const real = minutosDoDia(curva.horaInicio);
  if (prev !== null && real !== null && dc && dk && dc.join() === dk.join() && real < prev) {
    d.push({
      nivel: "atencao",
      campo: "Horário de início",
      comunicado: comunicado.horarioInicioPrevisto ?? "",
      curva: curva.horaInicio ?? "",
      detalhe: "O tratamento começou antes do horário informado no comunicado.",
    });
  }

  return d;
}
