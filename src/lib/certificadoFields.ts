import type { CertificadoCampos } from "./types";

export type CampoKey = keyof CertificadoCampos;

export interface CampoDef {
  key: CampoKey;
  label: string;
}

export const CAMPOS: Record<CampoKey, CampoDef> = {
  numeroCertificado: { key: "numeroCertificado", label: "Número do Certificado" },
  "1.1_razaoSocial": { key: "1.1_razaoSocial", label: "1.1. Razão social" },
  "1.2_cnpj": { key: "1.2_cnpj", label: "1.2. CNPJ" },
  "1.3_crea": { key: "1.3_crea", label: "1.3. Nº de registro no CREA" },
  "1.4_endereco": { key: "1.4_endereco", label: "1.4. Endereço completo com CEP" },
  "1.5_telefone": { key: "1.5_telefone", label: "1.5. Telefone" },
  "1.6_email": { key: "1.6_email", label: "1.6. Endereço Eletrônico" },
  "1.7_codigoMapa": {
    key: "1.7_codigoMapa",
    label: "1.7. Código alfanumérico do cadastro junto ao MAPA",
  },
  "2.1_razaoSocialCliente": { key: "2.1_razaoSocialCliente", label: "2.1. Razão Social" },
  "2.2_cnpjCliente": { key: "2.2_cnpjCliente", label: "2.2. CNPJ" },
  "2.3_enderecoCliente": {
    key: "2.3_enderecoCliente",
    label: "2.3. Endereço completo com CEP",
  },
  "2.4_telefoneCliente": { key: "2.4_telefoneCliente", label: "2.4. Telefone" },
  "2.5_emailCliente": { key: "2.5_emailCliente", label: "2.5. Endereço eletrônico" },
  "3.1_numeroComunicado": {
    key: "3.1_numeroComunicado",
    label: "3.1. Número do Comunicado de Tratamento",
  },
  "3.2_enderecoTratamento": {
    key: "3.2_enderecoTratamento",
    label: "3.2. Endereço completo onde foi realizado o tratamento",
  },
  "3.3_destino": { key: "3.3_destino", label: "3.3. Destino" },
  "3.4_descricaoProduto": { key: "3.4_descricaoProduto", label: "3.4. Descrição do produto" },
  "3.5_volumes": { key: "3.5_volumes", label: "3.5. Número e descrição dos volumes" },
  "3.6_quantidade": { key: "3.6_quantidade", label: "3.6. Quantidade de produto tratado" },
  "3.7_lote": { key: "3.7_lote", label: "3.7. Número do lote" },
  "3.8_ciclo": { key: "3.8_ciclo", label: "3.8. Número do Ciclo de Tratamento" },
  "3.9_marcasDistintivas": { key: "3.9_marcasDistintivas", label: "3.9. Marcas distintivas" },
  "3.10_modalidade": { key: "3.10_modalidade", label: "3.10. Modalidade de Tratamento" },
  "3.11_dataInicio": { key: "3.11_dataInicio", label: "3.11. Data do início do tratamento" },
  "3.12_horarioInicio": {
    key: "3.12_horarioInicio",
    label: "3.12. Horário do início do tratamento",
  },
  "3.13_dataTermino": { key: "3.13_dataTermino", label: "3.13. Data do término do tratamento" },
  "3.14_horarioTermino": {
    key: "3.14_horarioTermino",
    label: "3.14. Horário do término do tratamento",
  },
  "3.15_temperaturaDuracao": { key: "3.15_temperaturaDuracao", label: "3.15. Temperatura / Duração" },
  "4_localEmissao": { key: "4_localEmissao", label: "4. Local de emissão" },
  responsavelTecnico: { key: "responsavelTecnico", label: "Responsável Técnico (assinatura)" },
};

export interface Secao {
  titulo: string;
  linhas: CampoKey[][];
}

// Cada item de `linhas` é uma linha da tabela do certificado; um array com
// 2 chaves vira 2 colunas, com 1 chave vira uma linha ocupando a largura toda.
export const SECOES: Secao[] = [
  {
    titulo: "1. Dados do Cadastro",
    linhas: [
      ["1.1_razaoSocial", "1.2_cnpj"],
      ["1.3_crea", "1.4_endereco"],
      ["1.5_telefone"],
      ["1.6_email", "1.7_codigoMapa"],
    ],
  },
  {
    titulo: "2. Dados do Tomador de Serviço",
    linhas: [
      ["2.1_razaoSocialCliente", "2.2_cnpjCliente"],
      ["2.3_enderecoCliente"],
      ["2.4_telefoneCliente", "2.5_emailCliente"],
    ],
  },
  {
    titulo: "3. Dados do Tratamento Fitossanitário com fins Quarentenários",
    linhas: [
      ["3.1_numeroComunicado", "3.2_enderecoTratamento"],
      ["3.3_destino", "3.4_descricaoProduto"],
      ["3.5_volumes", "3.6_quantidade"],
      ["3.7_lote", "3.8_ciclo"],
      ["3.9_marcasDistintivas", "3.10_modalidade"],
      ["3.11_dataInicio", "3.12_horarioInicio"],
      ["3.13_dataTermino", "3.14_horarioTermino"],
      ["3.15_temperaturaDuracao"],
    ],
  },
  {
    titulo: "4. Local de emissão",
    linhas: [["4_localEmissao"]],
  },
];
