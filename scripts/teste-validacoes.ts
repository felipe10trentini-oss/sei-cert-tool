import { validarComunicadoCurva } from "../src/lib/validacoes";
import type { ComunicadoData, CurvaData } from "../src/lib/types";

const comunicadoBase: ComunicadoData = {
  comunicadoNumero: "1559/2026", clienteNome: "X", clienteCnpj: "1", enderecoTratamento: "R", unidadeVolante: "Unidade 1",
  destinoComunicado: "Indefinido", produto: "Paletes, ripas, caixas e kits caixas de madeira", volumes: "Unidades",
  quantidade: "135 paletes, 1.000 ripas de fechamento, 02 caixas montadas e 20 kits caixas (composto por 20 bases, 20 tampas e 80 laterais)",
  marcasDistintivas: "N/A", modalidade: "Tratamento Térmico HT - AQF", dataInicioPrevista: "24/09/2026",
  horarioInicioPrevisto: "08h00m", duracaoPrevista: "32 min", temperaturaPrevista: "56°C", observacao: "",
};
const curvaBase: CurvaData = {
  loteCiclo: "189", controladorNumero: "1", controladorSerie: "x", dataInicio: "24/09/2026", dataTermino: "24/09/2026",
  horaInicio: "10:05", horaInicioFmt: "10h05m", horaTerminoEstimada: "10h36m", temperaturaControle: null,
  temperaturaTratamento: "56", duracaoMin: 32, responsavelTecnico: "G", operador: "J", volumeTotalPecas: "1157",
  concluido: true, descricaoCurva: "135 paletes, 1.000 ripas de fechamento, 02 caixas montadas e 20 kits caixas",
};

function rodar(nome: string, com: Partial<ComunicadoData>, cur: Partial<CurvaData>, arq = "1495 MANN 189.pdf", criado: string | null = "23/09/2026") {
  const d = validarComunicadoCurva({
    curva: { ...curvaBase, ...cur }, comunicado: { ...comunicadoBase, ...com }, nomeArquivoCurva: arq, comunicadoCriadoEm: criado,
  });
  console.log(`\n# ${nome}: ${d.length === 0 ? "nenhuma divergência" : ""}`);
  for (const x of d) console.log(`  [${x.nivel}] ${x.campo} | com: ${x.comunicado} | curva: ${x.curva}\n     ${x.detalhe}`);
}

rodar("base (tudo certo)", {}, {});
rodar("data: só o dia", { dataInicioPrevista: "23/09/2026" }, {});
rodar("data: só o mês", { dataInicioPrevista: "24/08/2026" }, {});
rodar("data: só o ano", { dataInicioPrevista: "24/09/2025" }, {});
rodar("data: dia e mês", { dataInicioPrevista: "25/10/2026" }, {});
rodar("descrição: quantidade de um item", { quantidade: "135 paletes, 1.000 ripas de fechamento, 02 caixas montadas e 25 kits caixas" }, {});
rodar("descrição: item ausente na curva", {}, { descricaoCurva: "135 paletes, 1.000 ripas de fechamento e 20 kits caixas" });
rodar("descrição: só produto (sem números), diferente", { produto: "Paletes de madeira", quantidade: "400" }, { descricaoCurva: "Kits embalagens", volumeTotalPecas: "400" });
rodar("descrição: produto igual, sem números", { produto: "Paletes de madeira", quantidade: "400" }, { descricaoCurva: "Pallets", volumeTotalPecas: "400" });
rodar("temperatura e duração", { temperaturaPrevista: "60°C", duracaoPrevista: "40 min" }, {});
rodar("lote do arquivo diferente", {}, {}, "1495 MANN 190.pdf");
rodar("sem concluído", {}, { concluido: false });
rodar("comunicado criado depois", {}, {}, "1495 MANN 189.pdf", "26/09/2026");
rodar("início antes do horário", { horarioInicioPrevisto: "11h00m" }, {});
