# Candeia Tec: guia para sessões do Claude

Responda em português, passo a passo e sem jargão. O dono é o Solano.

Trabalho no PC: ver bicalho743/meu-enxoval-em-dia/docs/CLAUDE-NO-PC.md

## O que é este repositório
- **Tipo:** site estático (não é app de loja). Publicado pelo GitHub Pages a partir da `main`, domínio **candeiatec.com.br**.
- `index.html`: site público. `hub/index.html`: painel interno com login Google (Firebase `corujalabs-hub`, 3 e-mails liberados).
- **CRM** (leads, vendas, campanhas, funil, automações do n8n): comece por [crm/LEIA-ME.md](crm/LEIA-ME.md).
  Plano e histórico: [crm/PLANO.md](crm/PLANO.md). Banco: [crm/banco/ESQUEMA.md](crm/banco/ESQUEMA.md).
- **Funções do Supabase** do CRM: `supabase/functions/` (hub-leads, hub-funil, hub-campanhas). Migrações: `supabase/migrations/`.
- **Apps e catálogo:** [CLAUDE-APPS.md](CLAUDE-APPS.md) e `apps/`. Os apps (Planner Organiza, MultiplicaMente,
  Meu Enxoval em Dia, Meu Studio em Dia) têm repositório próprio, com o CLAUDE.md de cada um.

## Ids e serviços
| Serviço | Id / endereço |
|---|---|
| Supabase (CRM) | projeto "Candeia CRM" `zottntimhhsgwsgtvguz` |
| Firebase (login do Hub) | `corujalabs-hub` |
| n8n | https://n8n-production-8a4b.up.railway.app (Railway) |
| Planilha do time | Google Sheets `1qfFkpP9ACuzrqQV232LqdaUsPi6kgR15tx0Gjqqcx8Y` |
| Funil do Planner | `plannerorganiza-api.onrender.com/admin/funil` (Render, repo PlannerOrganizer) |
| Conta de anúncios Meta | `act_382745975868770` (app "Candeia Tec Executor" 1456034082677762) |
| WhatsApp oficial | YCloud, WABA 1007475751983855, chamado #3912 |
| Expo, Codemagic, RevenueCat, App Store, Play | não se aplicam a este repositório (ver o repo de cada app) |

## Como publicar
- Site e Hub: commit e push na `main`. O GitHub Pages publica sozinho em 1 a 2 minutos.
- Funções do Supabase: deploy pelo conector do Supabase (`verify_jwt = false`, elas conferem o login sozinhas).
- Ver localmente: `python -m http.server 8080` na pasta do repositório e abrir http://localhost:8080/hub/.
- Não há build de loja nem workflow do Codemagic aqui.

## Textos e artes
- Textos do CRM e do Hub: dentro de `hub/index.html` e `crm/`.
- E-mails de boas-vindas: Planner Organiza usa o e-mail do backend do Planner (Brevo, lista 7). Os demais
  produtos ainda não têm texto (sairão pela Brevo com remetente Candeia Tec).

## Onde paramos (26/11/2026)
- **Pronto e publicado:** telas Leads (CRM), Funil do Planner e Campanhas no Hub; fluxos do n8n Kiwify → CRM,
  Espelho da aba Leads, Brevo lista 7 → CRM e Gasto das campanhas (aba Métricas). Fluxo "Meta Ads — Budget FDS
  Boost" desligado (token vencido).
- **Esperando outra pessoa/sessão:**
  - sessão do PlannerOrganizer criar o `/admin/funil` e a chave. Depois o Solano salva `PLANNER_FUNIL_CHAVE` nos Secrets do Supabase;
  - YCloud responder o chamado #3912 (erro #100, forma de pagamento da WABA), ou o Solano responder ao Jose.
- **Falta fazer:**
  - autenticar candeiatec.com.br na Brevo e aprovar os textos de boas-vindas dos outros produtos;
  - (opcional) token só leitura do Meta para o fluxo de gasto por anúncio (`R9Gyn15TxNgZWflS`). Ao ligar, desligar o da aba Métricas.
- **Decisões pendentes do Solano:**
  - limpeza visual do Hub: proposta de 7 itens no menu e uma cor só;
  - Gestor de Anúncios do OpenBot adotar o padrão de UTM das campanhas novas.
- **Branches:** trabalhar na `main`. `claude/serene-rubin-xpfd62` é um histórico separado com o plano antigo
  (`docs/crm/`); o conteúdo útil já foi para `crm/PLANO.md`. As branches `claude/hub-*` já estão na `main`.

## Regras
- Repositório **público**: nunca colocar chaves, tokens, senhas ou dados de clientes.
- Pagamento, apagar algo ou mensagem para cliente: perguntar ao Solano antes.
- A aba "Leads" da planilha do time é escrita pelo n8n: não editar à mão.
- Não religar o fluxo "Temp — HTTP Proxy" do n8n.
