import type { CurvaData } from "./types";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Soma minutos a um horário "HH:MM:SS" e devolve no formato "HHhMMm".
 * Não trata virada de dia (tratamentos deste equipamento não cruzam a meia-noite).
 */
function addMinutesFmt(horaHHMMSS: string, minutes: number): string {
  const [h, m, s] = horaHHMMSS.split(":").map(Number);
  const totalMin = h * 60 + m + minutes;
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${pad2(hh)}h${pad2(mm)}m`;
}

/**
 * Extrai os dados da curva de tratamento do controlador Digisystem CRG08.
 */
export function parseCurvaCRG08(text: string): CurvaData {
  const mNtrat = text.match(/NTrat:\s*(\d+)/);
  const mInicio = text.match(
    /Início do Tratamento na leitura \d+\s*-\s*(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/
  );
  const mTc = text.match(/Temperatura de Controle \(Tc\):\s*(\d+)\s*º?C/);
  const mTt = text.match(/Temperatura do Tratamento \(Tt\):\s*(\d+)\s*º?C/);
  const mTempo = text.match(/Tempo do Tratamento \(tt\):\s*(\d+)\s*minuto/);
  const mResp = text.match(/Responsável Técnico:\s*(.+)/);
  const mOperador = text.match(/Operador:\s*(.+)/);
  const mVolume = text.match(/Volume total:\s*(\d+)\s*peças/);
  const mDescricao = text.match(/Descrição:\s*(.+)/);
  const mSerie = text.match(/Relatório do Controlador Nº (\d+) \(Nº Série:\s*([\w-]+)\)/);

  const dataInicio = mInicio ? mInicio[1] : null;
  const horaInicio = mInicio ? mInicio[2] : null;
  const ttMin = mTempo ? parseInt(mTempo[1], 10) : null;

  let horaInicioFmt: string | null = null;
  let horaTerminoEstimada: string | null = null;
  if (horaInicio) {
    horaInicioFmt = addMinutesFmt(horaInicio, 0);
    if (ttMin) {
      // Convenção interna: o primeiro e o último minuto contam como completos,
      // então o término é início + (duração - 1) minutos.
      horaTerminoEstimada = addMinutesFmt(horaInicio, ttMin - 1);
    }
  }

  return {
    loteCiclo: mNtrat ? mNtrat[1] : null,
    controladorNumero: mSerie ? mSerie[1] : null,
    controladorSerie: mSerie ? mSerie[2] : null,
    dataInicio,
    dataTermino: dataInicio,
    horaInicioFmt,
    horaTerminoEstimada,
    temperaturaControle: mTc ? mTc[1] : null,
    temperaturaTratamento: mTt ? mTt[1] : null,
    duracaoMin: ttMin,
    responsavelTecnico: mResp ? mResp[1].trim() : null,
    operador: mOperador ? mOperador[1].trim() : null,
    volumeTotalPecas: mVolume ? mVolume[1] : null,
    descricaoCurva: mDescricao ? mDescricao[1].trim() : null,
  };
}
