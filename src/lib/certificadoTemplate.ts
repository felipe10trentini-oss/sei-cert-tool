import type { CertificadoCampos } from "./types";
import {
  DECLARACOES,
  LINHAS,
  ROTULOS,
  ROTULO_NUMERO_CERTIFICADO,
  TITULO_CERTIFICADO,
  type CampoComRotulo,
} from "./certificadoFields";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const CINZA = 'style="background-color: rgb(221, 221, 221);"';

function paragrafo(conteudoHtml: string): string {
  return `<p class="Texto_Alinhado_Esquerda">${conteudoHtml}</p>`;
}

function celulaCampo(campos: CertificadoCampos, key: CampoComRotulo, colspan2: boolean): string {
  const valor = campos[key];
  const texto = valor ? `${ROTULOS[key]} ${esc(valor)}` : ROTULOS[key];
  return `<td${colspan2 ? ' colspan="2"' : ""}>${paragrafo(texto)}</td>`;
}

/**
 * Gera o HTML do certificado com a mesma estrutura, classes e frases do
 * modelo oficial do editor do SEI (Certificado TFQ-HT), com os valores
 * preenchidos logo após cada rótulo.
 */
export function buildCertificadoHtml(campos: CertificadoCampos): string {
  const linhas = LINHAS.map((linha) => {
    switch (linha.tipo) {
      case "secao":
        return `<tr><td colspan="2" ${CINZA}>${paragrafo(`<strong>${esc(linha.titulo)}</strong>`)}</td></tr>`;
      case "campos": {
        if (linha.campos.length === 1) {
          return `<tr>${celulaCampo(campos, linha.campos[0], true)}</tr>`;
        }
        return `<tr>${celulaCampo(campos, linha.campos[0], false)}${celulaCampo(campos, linha.campos[1], false)}</tr>`;
      }
      case "cinza": {
        const valor = campos[linha.campo];
        const texto = valor ? `${ROTULOS[linha.campo]} ${esc(valor)}` : ROTULOS[linha.campo];
        return `<tr><td colspan="2" ${CINZA}>${paragrafo(texto)}</td></tr>`;
      }
      case "declaracoes":
        return `<tr><td colspan="2">${DECLARACOES.map(paragrafo).join("")}${paragrafo("&nbsp;")}</td></tr>`;
    }
  }).join("");

  return (
    `<p class="Texto_Centralizado">&nbsp;</p>` +
    `<p class="Texto_Centralizado_Maiusculas_Negrito">${esc(TITULO_CERTIFICADO)}</p>` +
    `<p align="justify" class="Texto_Centralizado">${ROTULO_NUMERO_CERTIFICADO} ${esc(campos.numeroCertificado)}</p>` +
    `<p class="Texto_Centralizado">&nbsp;</p>` +
    `<table border="2" cellpadding="1" cellspacing="1"><tbody>${linhas}</tbody></table>` +
    `<p>&nbsp;</p>`
  );
}
