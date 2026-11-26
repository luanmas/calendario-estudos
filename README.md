# Plano de Estudos para Concursos

Aplicação local Next.js (App Router + TypeScript), Tailwind CSS, Prisma/SQLite e date-fns.

## Executar
1. Instale Node.js 20.9+.
2. Extraia o projeto e entre na pasta.
3. `npm install`
4. `npx prisma db push`
5. `npm run dev`
6. Acesse http://localhost:3000

O banco local é `prisma/dev.db` (criado pelo Prisma). `DATABASE_URL` está no `.env`.

## Funcionalidades
- Cadastro de matérias Básicas/Específicas, com cor de calendário.
- Cadastro de blocos por assunto, data e tipo.
- Calendário semanal com navegação.
- Status Pendente, Concluído e Não realizado.
- Ao concluir novo conteúdo, cria revisões D+1, D+7 e D+30 vinculadas ao bloco original.
- Pendências atrasadas são movidas para hoje ao abrir a página.

## Nota de regra
O rollover implementado traz blocos com status `PENDENTE` de datas anteriores para a data de hoje. Blocos marcados como `NAO_REALIZADO` ficam na data original; podem ser reabertos como pendentes pelo botão de relógio.
