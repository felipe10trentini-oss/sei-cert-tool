import type { CurvaData } from "./types";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Soma minutos a um horário "HH:MM:SS" e devolve no formato "HHhMMm".
 * A virada de dia é tratada à parte (dataTermino).
 */
function addMinutesFmt(horaHHMMSS: string, minutes: number): string {
  const [h, m, s] = horaHHMMSS.split(":").map(Number);
  const totalMin = h * 60 + m + minutes;
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${pad2(hh)}h${pad2(mm)}m`;
}

/** "30/09/2026" + 1 dia -> "01/10/2026". */
function diaSeguinte(data: string): string {
  const [d, m, a] = data.split("/").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + 1));
  return `${pad2(dt.getUTCDate())}/${pad2(dt.getUTCMonth() + 1)}/${dt.getUTCFullYear()}`;
}

/**
 * Término = fim da faixa verde da tabela de leituras: a leitura de nº (NL) igual à do início
 * + (tt - 1). O controlador grava uma leitura por minuto e conta o tempo pelas leituras:
 * sem leitura no minuto exato o término é a seguinte (início 10:05, tt 32 -> 10:37 quando a
 * tabela pula de 10:35 para 10:37), e uma interrupção estende a faixa. Vale para qualquer tt
 * (32, 75 min…). Linha da tabela: "011 163 10:05 058 056 080 070".
 */
function terminoPelasLeituras(text: string, nlInicio: number, horaInicio: string, ttMin: number): { minutos: number } | null {
  const leituras = [...text.matchAll(/^\d{3}\s+(\d{1,5})\s+(\d{2}):(\d{2})(?=\s|$)/gm)].map((m) => ({
    nl: parseInt(m[1], 10),
    min: parseInt(m[2], 10) * 60 + parseInt(m[3], 10),
  }));
  const fim = leituras.filter((l) => l.nl >= nlInicio + ttMin - 1).sort((a, b) => a.nl - b.nl)[0];
  if (!fim) return null;
  const [h, m] = horaInicio.split(":").map(Number);
  let minutos = fim.min - (h * 60 + m);
  if (minutos < 0) minutos += 1440; // passou da meia-noite
  return { minutos };
}

/**
 * Extrai os dados da curva de tratamento do controlador Digisystem CRG08.
 */
export function parseCurvaCRG08(text: string): CurvaData {
  // Dois layouts de curva do mesmo sistema:
  //  1) "(NTrat: 225)" e "Início do Tratamento na leitura 94 - 23/09/2026 09:42:00(concluído)"
  //  2) "(NSec 189)" e "Início do tratamento na leitura 123 (Fase 1) - 24/09/2026 10:05 (concluído)"
  const mNtrat = text.match(/NTrat:\s*(\d+)/) ?? text.match(/NSec:?\s*(\d+)/);
  const mInicio = text.match(
    /In[íi]cio do Tratamento na leitura (\d+)(?:\s*\(Fase \d+\))?\s*-\s*(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)/i
  );
  const mTc = text.match(/Temperatura de Controle \(Tc\):\s*(\d+)\s*º?C/);
  const mTt = text.match(/Temperatura do Tratamento \(Tt\):\s*(\d+)\s*º?C/);
  const mTempo = text.match(/Tempo do Tratamento \(tt\):\s*(\d+)\s*minuto/);
  const mResp = text.match(/Responsável Técnico:\s*(.+)/);
  const mOperador = text.match(/Operador:\s*(.+)/);
  const mVolume = text.match(/Volume total:\s*(\d+)\s*peças/i);
  const mDescricao = text.match(/Descrição:\s*(.+)/);
  // Layout 2 não tem "Descrição:": a descrição fica entre "Programa:" e "Produto(s):".
  const mDescricao2 = text.match(/Programa:[^\n]*\n([\s\S]*?)\n\s*Produto\(s\):/);
  const mSerie = text.match(/Relatório do Controlador Nº (\d+) \(Nº Série:\s*([\w-]+)\)/);

  const nlInicio = mInicio ? parseInt(mInicio[1], 10) : null;
  const dataInicio = mInicio ? mInicio[2] : null;
  const horaInicio = mInicio ? mInicio[3] : null;
  const ttMin = mTempo ? parseInt(mTempo[1], 10) : null;

  let horaInicioFmt: string | null = null;
  let horaTerminoEstimada: string | null = null;
  let dataTermino = dataInicio;
  if (horaInicio) {
    horaInicioFmt = addMinutesFmt(horaInicio, 0);
    if (ttMin) {
      // Fim da faixa verde; sem a tabela de leituras, a convenção antiga: início + (tt - 1).
      const fim = nlInicio != null ? terminoPelasLeituras(text, nlInicio, horaInicio, ttMin) : null;
      const minutos = fim?.minutos ?? ttMin - 1;
      horaTerminoEstimada = addMinutesFmt(horaInicio, minutos);
      const [h, m] = horaInicio.split(":").map(Number);
      if (dataInicio && h * 60 + m + minutos >= 1440) dataTermino = diaSeguinte(dataInicio);
    }
  }

  return {
    // O certificado usa o lote com 3 dígitos (a curva imprime "NTrat: 10", o certificado "010").
    loteCiclo: mNtrat ? mNtrat[1].padStart(3, "0") : null,
    controladorNumero: mSerie ? mSerie[1] : null,
    controladorSerie: mSerie ? mSerie[2] : null,
    dataInicio,
    dataTermino,
    horaInicio: horaInicio ? horaInicio.slice(0, 5) : null,
    horaInicioFmt,
    horaTerminoEstimada,
    temperaturaControle: mTc ? mTc[1] : null,
    temperaturaTratamento: mTt ? mTt[1] : null,
    duracaoMin: ttMin,
    responsavelTecnico: mResp ? mResp[1].trim() : null,
    operador: mOperador ? mOperador[1].trim() : null,
    volumeTotalPecas: mVolume ? mVolume[1] : null,
    descricaoCurva: mDescricao
      ? mDescricao[1].trim()
      : mDescricao2
        ? mDescricao2[1].replace(/\s+/g, " ").trim() || null
        : null,
    concluido: /\(conclu[ií]do\)/i.test(text),
  };
}
