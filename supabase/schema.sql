-- Tabela de clientes usada para completar telefone/e-mail no certificado
-- (o Comunicado em PDF só traz razão social, CNPJ e endereço do tratamento).
create table if not exists clientes (
  id bigint generated always as identity primary key,
  apelido text,
  nome text not null,
  cnpj text not null,
  endereco text,
  email text,
  telefone text,
  endereco_escritorio text,
  created_at timestamptz not null default now()
);

create index if not exists clientes_cnpj_idx on clientes (cnpj);

alter table clientes enable row level security;

-- A API só é acessada pelo backend com a service role key, que ignora RLS.
-- Nenhuma policy é criada de propósito: sem policy = sem acesso via chave anon.

-- Linhas da planilha de controle do MAPA (aba TÉRMICO), uma por certificado emitido.
-- `linha` guarda as 26 colunas (objeto JSON com as chaves de src/lib/mapaPlanilha.ts).
create table if not exists certificados_emitidos (
  id bigint generated always as identity primary key,
  numero_certificado text not null unique,
  data_tratamento date,
  linha jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists certificados_emitidos_data_idx on certificados_emitidos (data_tratamento);

alter table certificados_emitidos enable row level security;
