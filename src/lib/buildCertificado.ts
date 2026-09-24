import {
  EMPRESA,
  MODALIDADE_TEXTO,
  DESTINO_FIXO,
  VOLUMES_FIXO,
  MARCAS_DISTINTIVAS_FIXO,
} from "./empresa";
import type { CurvaData, ComunicadoData, Cliente, ExtractResult } from "./types";

export function buildCertificado(
  curva: CurvaData,
  comunicado: ComunicadoData,
  cliente: Cliente | null,
  numeroCertificado: string
): ExtractResult {
  const avisos: string[] = [];

  let enderecoCliente: string | null;
  let telefoneCliente: string | null = null;
  let emailCliente: string | null = null;

  if (cliente) {
    enderecoCliente = cliente.enderecoEscritorio || cliente.endereco;
    telefoneCliente = cliente.telefone;
    emailCliente = cliente.email;
  } else {
    avisos.push(
      `Cliente não encontrado no cadastro pelo CNPJ do comunicado (${comunicado.clienteCnpj ?? "não identificado"}). ` +
        "Endereço/telefone/e-mail do cliente precisam ser conferidos manualmente."
    );
    enderecoCliente = comunicado.enderecoTratamento;
  }

  if (!curva.loteCiclo) {
    avisos.push("Não foi possível localizar o número de lote/ciclo (NTrat) na curva.");
  }
  if (!comunicado.comunicadoNumero) {
    avisos.push("Não foi possível localizar o número do Comunicado de Tratamento.");
  }
  if (!numeroCertificado) {
    avisos.push("Informe o número do certificado (não vem dos PDFs, é atribuído por vocês).");
  }

  const temperaturaDuracao =
    curva.temperaturaTratamento && curva.duracaoMin
      ? `${curva.temperaturaTratamento} °C / ${curva.duracaoMin} min`
      : null;

  const campos = {
    numeroCertificado,
    "1.1_razaoSocial": EMPRESA.razaoSocial,
    "1.2_cnpj": EMPRESA.cnpj,
    "1.3_crea": EMPRESA.crea,
    "1.4_endereco": EMPRESA.endereco,
    "1.5_telefone": EMPRESA.telefone,
    "1.6_email": EMPRESA.email,
    "1.7_codigoMapa": EMPRESA.codigoMapa,
    "2.1_razaoSocialCliente": comunicado.clienteNome,
    "2.2_cnpjCliente": comunicado.clienteCnpj,
    "2.3_enderecoCliente": enderecoCliente,
    "2.4_telefoneCliente": telefoneCliente,
    "2.5_emailCliente": emailCliente,
    "3.1_numeroComunicado": comunicado.comunicadoNumero,
    "3.2_enderecoTratamento": enderecoCliente,
    "3.3_destino": DESTINO_FIXO,
    "3.4_descricaoProduto": comunicado.produto,
    "3.5_volumes": VOLUMES_FIXO,
    "3.6_quantidade": comunicado.quantidade,
    "3.7_lote": curva.loteCiclo,
    "3.8_ciclo": curva.loteCiclo,
    "3.9_marcasDistintivas": MARCAS_DISTINTIVAS_FIXO,
    "3.10_modalidade": MODALIDADE_TEXTO,
    "3.11_dataInicio": curva.dataInicio,
    "3.12_horarioInicio": curva.horaInicioFmt,
    "3.13_dataTermino": curva.dataTermino,
    "3.14_horarioTermino": curva.horaTerminoEstimada,
    "3.15_temperaturaDuracao": temperaturaDuracao,
    "4_localEmissao": EMPRESA.localEmissao,
    responsavelTecnico: curva.responsavelTecnico || EMPRESA.responsavelTecnico,
  };

  return { campos, avisos, clienteEncontrado: cliente !== null };
}
