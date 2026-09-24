export interface Cliente {
  apelido: string | null;
  nome: string | null;
  cnpj: string | null;
  endereco: string | null;
  email: string | null;
  telefone: string | null;
  enderecoEscritorio: string | null;
}

export interface ComunicadoData {
  comunicadoNumero: string | null;
  clienteNome: string | null;
  clienteCnpj: string | null;
  enderecoTratamento: string | null;
  unidadeVolante: string | null;
  destinoComunicado: string | null;
  produto: string | null;
  volumes: string | null;
  quantidade: string | null;
  marcasDistintivas: string | null;
  modalidade: string | null;
  dataInicioPrevista: string | null;
  horarioInicioPrevisto: string | null;
  duracaoPrevista: string | null;
  temperaturaPrevista: string | null;
  observacao: string | null;
}

export interface CurvaData {
  loteCiclo: string | null;
  controladorNumero: string | null;
  controladorSerie: string | null;
  dataInicio: string | null;
  dataTermino: string | null;
  horaInicioFmt: string | null;
  horaTerminoEstimada: string | null;
  temperaturaControle: string | null;
  temperaturaTratamento: string | null;
  duracaoMin: number | null;
  responsavelTecnico: string | null;
  operador: string | null;
  volumeTotalPecas: string | null;
  descricaoCurva: string | null;
}

export interface CertificadoCampos {
  numeroCertificado: string;
  "1.1_razaoSocial": string;
  "1.2_cnpj": string;
  "1.3_crea": string;
  "1.4_endereco": string;
  "1.5_telefone": string;
  "1.6_email": string;
  "1.7_codigoMapa": string;
  "2.1_razaoSocialCliente": string | null;
  "2.2_cnpjCliente": string | null;
  "2.3_enderecoCliente": string | null;
  "2.4_telefoneCliente": string | null;
  "2.5_emailCliente": string | null;
  "3.1_numeroComunicado": string | null;
  "3.2_enderecoTratamento": string | null;
  "3.3_destino": string;
  "3.4_descricaoProduto": string | null;
  "3.5_volumes": string;
  "3.6_quantidade": string | null;
  "3.7_lote": string | null;
  "3.8_ciclo": string | null;
  "3.9_marcasDistintivas": string;
  "3.10_modalidade": string;
  "3.11_dataInicio": string | null;
  "3.12_horarioInicio": string | null;
  "3.13_dataTermino": string | null;
  "3.14_horarioTermino": string | null;
  "3.15_temperaturaDuracao": string | null;
  "4_localEmissao": string;
  responsavelTecnico: string;
}

export interface ExtractResult {
  campos: CertificadoCampos;
  avisos: string[];
  clienteEncontrado: boolean;
}
