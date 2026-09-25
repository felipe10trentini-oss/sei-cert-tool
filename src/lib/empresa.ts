// Dados fixos da empresa prestadora de serviço (Mann & Cia Ltda) e textos
// padrão do Certificado de Tratamento Fitossanitário com fins Quarentenários.
// Ajuste aqui se algum dado cadastral mudar.

export const EMPRESA = {
  razaoSocial: "Mann & Cia Ltda",
  cnpj: "00.093.600/0001-41",
  crea: "61154",
  endereco: "Rua Ronald José Carboni, 330 - CEP: 82.810-120 - Curitiba - PR",
  telefone: "(41) 3107-1515",
  email: "tratamentosmann@gmail.com",
  codigoMapa: "BR-PR0765",
  localEmissao: "Curitiba - PR",
  responsavelTecnico: "Geraldo Adolfo Mann",
} as const;

export const MODALIDADE_TEXTO =
  "tratamento térmico por calor: ar quente forçado: AQF - HT";
export const DESTINO_FIXO = "Estoque";
export const VOLUMES_FIXO = "Nihil";
export const MARCAS_DISTINTIVAS_FIXO = "Nihil";

// Planilha de controle do MAPA (aba TÉRMICO): valores que se repetem em todas as linhas.
export const MAPA_CONSTANTES = {
  objetivo: "Atendimento à NIMF15",
  finalidade: "Exp.",
  processoComunicado: "21034.012876/2026-29",
  unidades: "Unidades",
  volumeCamara: "56",
} as const;

// "Unidade volante" do comunicado -> placa do veículo (coluna "Identificação da unidade de tratamento").
export const PLACA_POR_UNIDADE: Record<string, string> = {
  "Unidade 1": "ATU 0929",
  "Unidade 2": "RHV3A66",
  "Unidade 3": "JCV8C11",
  "Unidade 4": "RIX2I54",
  "Unidade 5": "TQV2A94",
};
