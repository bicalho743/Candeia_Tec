# Candeia CRM: mapa

Comece por aqui. Este arquivo diz **onde fica cada peça do CRM** das marcas Candeia Tec, Tâmara Cavalcante,
MultiplicaMente (Vida em Método) e Frei Miguel. O plano completo, as decisões e o histórico estão em
[PLANO.md](PLANO.md). As tabelas e funções do banco estão em [banco/ESQUEMA.md](banco/ESQUEMA.md).

> **Repositório público.** Aqui só entram código, IDs técnicos e documentação. Nunca chaves, tokens,
> senhas nem dados de clientes. Segredos ficam no n8n (credenciais), nos Secrets do Supabase ou no Render.

## Peças

| Peça | Onde | Observação |
|---|---|---|
| Banco do CRM | Supabase, projeto **Candeia CRM** (`zottntimhhsgwsgtvguz`, São Paulo, plano Pro) | RLS ligado em tudo, sem regra pública. Só a chave de serviço lê e grava. |
| Telas | Hub: `hub/index.html` → candeiatec.com.br/hub, menu "Visão geral" | **Leads (CRM)**, **Funil do Planner**, **Campanhas**. Login Google do Hub (3 e-mails). |
| Funções que alimentam as telas | `supabase/functions/hub-leads`, `hub-funil`, `hub-campanhas` | Conferem no servidor o token do Firebase (`corujalabs-hub`) e a lista de e-mails. Deploy com `verify_jwt = false`. |
| Automações | n8n no Railway: https://n8n-production-8a4b.up.railway.app | Fluxos abaixo. Ativar = botão "Publish". |
| Planilha do time | Google Sheets `1qfFkpP9ACuzrqQV232LqdaUsPi6kgR15tx0Gjqqcx8Y` | Aba **Leads** é apagada e reescrita pelo n8n: **não editar à mão**. Abas **Campanhas**, **Métricas** e **Metas** são do Analista (OpenBot). |
| Funil do Planner | Repositório **PlannerOrganizer**, `GET plannerorganiza-api.onrender.com/admin/funil?dias=N` | Só leitura, cabeçalho `X-Funil-Chave`. O CRM **não** acessa o banco do Planner. Segredo `PLANNER_FUNIL_CHAVE` nos Secrets do Supabase. |
| E-mail | Brevo | Planner Organiza: boas-vindas saem do backend do Planner (lista 7). Demais produtos: Brevo com remetente Candeia Tec (a configurar). |
| WhatsApp oficial | YCloud (coexistência) | Travado no erro #100 (forma de pagamento). Chamado YCloud #3912. Ver PLANO.md, seção 7. |

## Fluxos do n8n

| Fluxo | ID | Estado | O que faz |
|---|---|---|---|
| CRM — Kiwify (todos os produtos e eventos) | `DMCkVjYUBHrmDvji` | ligado | Webhook `…/webhook/kiwify-crm`. Confere o pedido na API da Kiwify e chama `registrar_evento` (com UTM). |
| CRM — Espelho da aba Leads (planilha do time) | — | ligado | A cada 15 min reescreve a aba Leads a partir de `vw_leads`. |
| CRM — Leads da Brevo (Planner Organiza) | `aHkGs7TzJdSRpvkl` | ligado | A cada 15 min lê a lista 7 da Brevo → `registrar_evento` (`lead_formulario`, marca candeia, `brevo:<id>`, sem duplicar). Só a lista 7, por decisão do Solano. |
| CRM — Gasto das campanhas (aba Métricas) | `nFyYkc98q9uz4AEA` | ligado | Às 12h e 20h lê a aba Métricas → `gastos_campanha` (nível campanha). Só prefixos `CASAEMORDEM_` e `PLANNER_`. |
| CRM — Gasto diário do Meta Ads | `R9Gyn15TxNgZWflS` | **desligado** | Nível anúncio, direto da API do Meta. Precisa de credencial "Facebook Graph API" (token só leitura). Ao ligar, **desligar** o fluxo da aba Métricas para não somar duas vezes. |

Credenciais usadas: "Supabase account", "Kiwify API - Casa em Ordem", "Brevo — n8n CRM", "Google Sheets account".

## Campanhas e UTM

- A venda é ligada à campanha por `utm_campaign` (= nome da campanha no Meta) e à variante por `utm_content` (= nome do anúncio).
- Padrão para campanhas novas (campo "Parâmetros de URL" do anúncio):
  `utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}`
- Conta de anúncios usada: `act_382745975868770` (portfólio tamaraorganiza). Tem campanhas que não são da Candeia Tec: o CRM só considera os prefixos `CASAEMORDEM_` e `PLANNER_`.
- Quem faz o quê (OpenBot): o **Gestor de Anúncios** cria as campanhas; o **Analista** lê os números e preenche a aba Métricas; o **estúdio** publica nas redes pelo Upload-Post. Vendas: a verdade é a Kiwify.

## Regras para quem mexer aqui

1. Não colocar segredo no repositório. Não imprimir segredo no chat.
2. Não editar a aba Leads da planilha à mão.
3. Não religar o fluxo "Temp — HTTP Proxy" do n8n.
4. Nada de mensagem automática para cliente sem aprovação do Solano. Eventos com `verificado: false` (carrinho) não disparam nada.
5. Antes de apagar qualquer coisa (contato, fluxo, credencial), perguntar ao Solano.
6. Mudança no banco: registrar em `supabase/migrations/` e atualizar `banco/ESQUEMA.md`.
