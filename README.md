# SEI Cert Tool — Mann & Cia

Extrai os dados do Certificado de Tratamento Fitossanitário com fins
Quarentenários (SEI/MAPA) a partir da curva de tratamento (Digisystem CRG08)
e do Comunicado de Tratamento em PDF, e gera um bloco de texto formatado
pronto para colar no editor do SEI.

Hoje cobre o **Digisystem CRG08** nos dois layouts de curva (lote como
`NTrat: 225` ou `NSec 189`; o parser reconhece sozinho). Os outros modelos
(Marrari SV580, Marrari SV520, Digisystem CRG2051) podem ser adicionados
depois criando um novo parser em `src/lib/parseCurva<Modelo>.ts`.

Teste de regressão contra certificados já emitidos (com `npm run dev` rodando):

```powershell
$env:CERT_DIR = "C:\pasta\com\os\PDFs"   # CERT NNNN ..., NNNN MANN LLL.pdf e COMUNICADO ...
npm run regress -- 1489 1495
```

## Como funciona

1. Você envia o PDF da curva + o PDF do comunicado.
2. O backend (`/api/extract`) extrai o texto dos dois PDFs e preenche os
   campos do certificado. O telefone/e-mail do cliente vêm de uma tabela
   `clientes` no Supabase (busca por CNPJ).
3. Você confere/edita os campos na tela e clica em **Copiar formatado**.
4. No editor do SEI, selecione tudo (Ctrl+A) e cole (Ctrl+V). O bloco inclui o
   título, a tabela e as frases fixas do Ministério, iguais ao modelo do SEI.

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha com os dados do seu projeto Supabase
npm run dev
```

Abre em http://localhost:3000

## Configurando o Supabase

1. Crie um projeto em https://supabase.com.
2. Rode o SQL de `supabase/schema.sql` no SQL Editor do projeto (cria a
   tabela `clientes`).
3. Copie a Project URL e a `service_role` key (Project Settings > API) para
   `.env.local`.
4. Importe os clientes da planilha existente:

   ```bash
   npm run import:clientes -- "C:\caminho\para\COMUNICADO 001-2026- MANN (BR-PR0765).xlsx"
   ```

   Roda de novo (com a planilha atualizada) sempre que precisar sincronizar.

## Deploy (Vercel)

1. Suba este repositório para o GitHub.
2. Importe o repositório em https://vercel.com/new.
3. Em Environment Variables, adicione `SUPABASE_URL` e
   `SUPABASE_SERVICE_ROLE_KEY` (os mesmos valores do `.env.local`).
4. Deploy.

## Estrutura

- `src/lib/parseCurvaCRG08.ts` — extrai dados da curva (lote, datas, horários, temperatura).
- `src/lib/parseComunicado.ts` — extrai dados do comunicado (cliente, quantidade, modalidade...).
- `src/lib/buildCertificado.ts` — combina tudo + dados fixos da empresa em `src/lib/empresa.ts`.
- `src/lib/clientes.ts` — busca cliente no Supabase por CNPJ.
- `src/app/api/extract/route.ts` — endpoint que recebe os PDFs e devolve o JSON pronto.
- `src/components/CertificatePreview.tsx` — tela de conferência/edição + botão copiar.
- `scripts/import-clientes.ts` — importa a aba DADOS da planilha para o Supabase.
