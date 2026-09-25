import type { CertificadoCampos } from "./types";

export type CampoKey = keyof CertificadoCampos;

// Rótulos exatamente como aparecem no modelo oficial do SEI (id_serie 3570),
// incluindo pequenas inconsistências do próprio modelo ("2.2 CNPJ:" sem ponto).
export const ROTULOS: Record<Exclude<CampoKey, "numeroCertificado" | "responsavelTecnico">, string> = {
  "1.1_razaoSocial": "1.1. Razão social:",
  "1.2_cnpj": "1.2. CNPJ:",
  "1.3_crea": "1.3. Nº de registro no CREA:",
  "1.4_endereco": "1.4. Endereço completo com CEP:",
  "1.5_telefone": "1.5. Telefone:",
  "1.6_email": "1.6. Endereço Eletrônico:",
  "1.7_codigoMapa": "1.7. Código alfanumérico do cadastro junto ao MAPA:",
  "2.1_razaoSocialCliente": "2.1. Razão Social:",
  "2.2_cnpjCliente": "2.2 CNPJ:",
  "2.3_enderecoCliente": "2.3. Endereço completo com CEP:",
  "2.4_telefoneCliente": "2.4. Telefone:",
  "2.5_emailCliente": "2.5 Endereço eletrônico:",
  "3.1_numeroComunicado": "3.1. Número do Comunicado de Tratamento:",
  "3.2_enderecoTratamento":
    "3.2. Endereço completo onde foi realizado o tratamento fitossanitário com fins quarentenários:",
  "3.3_destino": "3.3. Destino:",
  "3.4_descricaoProduto": "3.4. Descrição do produto:",
  "3.5_volumes": "3.5. Número e descrição dos volumes:",
  "3.6_quantidade": "3.6. Quantidade de produto tratado:",
  "3.7_lote": "3.7. Número do lote:",
  "3.8_ciclo": "3.8. Número do Ciclo de Tratamento:",
  "3.9_marcasDistintivas": "3.9. Marcas distintivas:",
  "3.10_modalidade": "3.10. Modalidade de Tratamento:",
  "3.11_dataInicio": "3.11. Data do início do tratamento:",
  "3.12_horarioInicio": "3.12. Horário do início do tratamento:",
  "3.13_dataTermino": "3.13. Data do término do tratamento:",
  "3.14_horarioTermino": "3.14. Horário do término do tratamento:",
  "3.15_temperaturaDuracao": "3.15. Temperatura:",
  "4_localEmissao": "4. Local de emissão:",
};

export type CampoComRotulo = keyof typeof ROTULOS;

export type LinhaTabela =
  | { tipo: "secao"; titulo: string }
  | { tipo: "campos"; campos: [CampoComRotulo] | [CampoComRotulo, CampoComRotulo] }
  | { tipo: "cinza"; campo: CampoComRotulo }
  | { tipo: "declaracoes" };

// Ordem e agrupamento das linhas da tabela, idênticos ao modelo do SEI.
export const LINHAS: LinhaTabela[] = [
  { tipo: "secao", titulo: "1. Dados do Cadastro" },
  { tipo: "campos", campos: ["1.1_razaoSocial", "1.2_cnpj"] },
  { tipo: "campos", campos: ["1.3_crea", "1.4_endereco"] },
  { tipo: "campos", campos: ["1.5_telefone"] },
  { tipo: "campos", campos: ["1.6_email", "1.7_codigoMapa"] },
  { tipo: "secao", titulo: "2. Dados do Tomador de Serviço" },
  { tipo: "campos", campos: ["2.1_razaoSocialCliente", "2.2_cnpjCliente"] },
  { tipo: "campos", campos: ["2.3_enderecoCliente"] },
  { tipo: "campos", campos: ["2.4_telefoneCliente", "2.5_emailCliente"] },
  { tipo: "secao", titulo: "3. Dados do Tratamento Fitossanitário com fins Quarentenários" },
  { tipo: "campos", campos: ["3.1_numeroComunicado", "3.2_enderecoTratamento"] },
  { tipo: "campos", campos: ["3.3_destino", "3.4_descricaoProduto"] },
  { tipo: "campos", campos: ["3.5_volumes", "3.6_quantidade"] },
  { tipo: "campos", campos: ["3.7_lote", "3.8_ciclo"] },
  { tipo: "campos", campos: ["3.9_marcasDistintivas", "3.10_modalidade"] },
  { tipo: "campos", campos: ["3.11_dataInicio", "3.12_horarioInicio"] },
  { tipo: "campos", campos: ["3.13_dataTermino", "3.14_horarioTermino"] },
  { tipo: "campos", campos: ["3.15_temperaturaDuracao"] },
  { tipo: "cinza", campo: "4_localEmissao" },
  { tipo: "declaracoes" },
];

// Frases fixas do Ministério (MAPA), presentes no fim do certificado.
export const DECLARACOES: string[] = [
  "- DECLARO para os devidos fins que assumo as responsabilidades pela veracidade das informações aqui prestadas, e estar ciente de que, a qualquer momento poderão ser auditadas, pela autoridade competente.",
  "- DECLARO, ainda, estar ciente de que prestar declaração falsa é crime previsto no art. 299 do Código Penal Brasileiro, sujeitando o declarante às suas penas, sem prejuízo de aplicação de outras sanções descritas na PORTARIA Nº 385, de 25 de agosto de 2021.",
  "- O DOCUMENTO DEVE SER PETICIONADO E ASSINADO DIGITALMENTE PELO RESPONSÁVEL TÉCNICO DA EMPRESA DEVIDAMENTE HABILITADO junto à área de TFQ do MAPA, conforme orientações constantes no Ofício-Circular nº1/2025/DIFTQ/CGFC/DSV/SDA/MAPA",
];

export const TITULO_CERTIFICADO =
  "CERTIFICADO DE TRATAMENTO FITOSSANITÁRIO COM FINS QUARENTENÁRIOS – HT";
export const ROTULO_NUMERO_CERTIFICADO =
  "Número do Certificado de Tratamento Fitossanitário com fins Quarentenários:";
