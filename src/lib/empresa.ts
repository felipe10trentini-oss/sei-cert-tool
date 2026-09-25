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
