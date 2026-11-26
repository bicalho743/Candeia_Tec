# Candeia Tec: guia para sessões do Claude

Responda em português, passo a passo e sem jargão. O dono é o Solano.

## Onde está cada coisa
- **CRM** (leads, vendas, campanhas, funil, automações do n8n): comece por [crm/LEIA-ME.md](crm/LEIA-ME.md).
- **Apps e catálogo:** [CLAUDE-APPS.md](CLAUDE-APPS.md) e `apps/`.
- **Site e Hub:** `index.html` (site público) e `hub/index.html` (painel interno com login), publicados pelo GitHub Pages a partir da `main` (domínio candeiatec.com.br).
- **Funções do Supabase** do CRM: `supabase/functions/`.

## Regras
- Repositório **público**: nunca colocar chaves, tokens, senhas ou dados de clientes.
- Pagamento, apagar algo ou mensagem para cliente: perguntar ao Solano antes.
- A aba "Leads" da planilha do time é escrita pelo n8n: não editar à mão.

## MultiplicaMente neste repositório (atualizado em 26/11/2026)
Trabalho no PC: ver bicalho743/meu-enxoval-em-dia/docs/CLAUDE-NO-PC.md

- **O app** é Capacitor e vive em `bicalho743/Multiplicamente` (CLAUDE.md lá: builds, Codemagic, lojas, onde paramos).
  Ids: pacote/bundle `com.solano.multiplicamente`; App Store Connect `6833585676`; Codemagic `6af482847e217e7e1a698645`;
  Firebase `multiplicamente-ccacc`; RevenueCat `proj19ead3d1` (o app não usa); Expo, Supabase e Render: não usa.
- **Aqui ficam:** a ficha do app no catálogo (`apps/catalogo.json`, id `mp5`), o card do portfólio
  (`assets/portfolio-data.js`) e as **páginas públicas** em `apps/multiplicamente/` (início, `suporte/`, `excluir-conta/`,
  `termos/`, `privacidade/`). Para refazer as páginas: `python apps/multiplicamente/gerar_paginas.py <raiz do repositório>`
  (no Windows, `python` no Git Bash). Depois rodar `python apps/gerar_planilha.py` se o catálogo mudar.
- **Textos e artes das lojas:** no repositório do app (`marketing/appstore/`, `marketing/loja/`, `marketing/social/`).
- **Onde paramos:** as páginas descrevem o app 1.0.29 (aba "Config", tabuadas 2 a 6 grátis). Ao publicar a 1.0.30 do app,
  trocar "Config" por "Perfil" em `suporte/` e `excluir-conta/`. O contato do app é contato@candeiatec.com.br.
- **Git:** as mudanças do MultiplicaMente estão na branch `claude/affectionate-lovelace-1iw52q`, que em 26/11 recebeu o
  `main` (merge comum). Nada disso está no `main` ainda: o site público só mostra depois de uma PR para o `main`.
  Ao juntar, conferir `apps/catalogo.json` (a ficha `mp5`) e o card `mp5` em `assets/portfolio-data.js`.
- **Pendente (usuário):** o Instagram do app está como "Vida em Metodo" (@vidaemmetodo01 no Upload-Post) e a bio aponta
  para um link que não abre; o certo é o da Google Play (ver CLAUDE.md do app).
