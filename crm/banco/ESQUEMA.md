# Candeia CRM: tabelas e funções (Supabase `zottntimhhsgwsgtvguz`)

Atualizado em 24/11/2026. Todas as tabelas têm RLS ligado e nenhuma regra pública.

## Tabelas

| Tabela | Colunas principais | Para quê |
|---|---|---|
| `marcas` | `id` (candeia, vida, frei, tamara), `nome`, `whatsapp`, `email_remetente`, `ativa` | Marcas atendidas |
| `produtos` | `id`, `marca_id`, `nome`, `preco`, `link_checkout`, `onde_acessa`, `garantia`, `upsell`, `faq`, `kiwify_product_ids[]` | Ficha de produto; a marca da venda vem daqui pelo id da Kiwify |
| `contatos` | `id`, `nome`, `telefone` (55DDDNÚMERO), `email` (minúsculo), `marcas[]`, `origem`, `etapa`, `tags[]`, `utm`, `whatsapp_optin`, `email_optin`, `nao_perturbe`, `responsavel` | Uma pessoa. Etapas: lead_novo, em_conversa, checkout_iniciado, pagamento_pendente, cliente, recorrente, perdido |
| `eventos` | `contato_id`, `marca_id`, `tipo`, `fonte`, `produto_id`, `produto_nome`, `valor`, `metodo_pagamento`, `link_pagamento`, `pedido_id`, `dados`, `utm`, `ocorreu_em` | Tudo o que aconteceu. Único por (fonte, pedido_id, tipo) |
| `mensagens` | `contato_id`, `canal`, `direcao`, `autor`, `texto`, `intencao`, `sentimento`, `status` | Histórico de WhatsApp, e-mail e Instagram |
| `tarefas` | `contato_id`, `tipo`, `motivo`, `prioridade`, `prazo`, `status`, `responsavel` | Casos para humano |
| `envios_programados` | `contato_id`, `evento_id`, `fluxo`, `canal`, `modelo`, `agendado_para`, `status` | Fila de lembretes e sequências |
| `gastos_campanha` | PK (`plataforma`, `dia`, `campanha_id`, `anuncio_id`); `campanha`, `conjunto`, `anuncio`, `gasto`, `impressoes`, `cliques`, `resultados` | Gasto diário. `anuncio_id = ''` quando o dado é só por campanha |
| `cache_externo` | `chave`, `dados`, `atualizado_em` | Cache de 10 min (funil do Planner) |
| `vw_leads` (visão) | contato + último evento + tarefas abertas + total comprado | Tela Leads e aba Leads da planilha |

Tipos de evento: lead_formulario, lista_espera, mensagem_recebida, checkout_abandonado, pix_gerado,
boleto_gerado, compra_aprovada, compra_recusada, reembolso, chargeback, trial_iniciado,
assinatura_ativa, assinatura_renovada, assinatura_cancelada, comentario_instagram, outro.

## Funções

| Função | Uso |
|---|---|
| `registrar_evento(p_tipo, p_fonte, p_telefone, p_email, p_nome, p_marca, p_pedido_id, p_produto_externo_id, p_produto_nome, p_valor, p_metodo, p_link, p_ocorreu_em, p_dados, p_utm, p_whatsapp_optin, p_email_optin)` | Porta de entrada do n8n (`POST /rest/v1/rpc/registrar_evento`). Cria ou junta o contato, grava o evento sem duplicar, acha a marca pelo produto, guarda a UTM no evento |
| `upsert_contato(...)` | Cria ou atualiza o contato; junta telefone e e-mail que estavam separados |
| `mesclar_contatos(p_manter, p_remover)` | Junta dois contatos com todo o histórico |
| `normalizar_telefone(p)` | Deixa só dígitos com 55 |
| `campanhas_resumo(p_dias)` | Gasto × leads × checkouts × vendas × receita por campanha e variante (tela Campanhas) |
| gatilhos `tg_evento_aplicar`, `tg_atualizado_em` | Mudam a etapa do contato a cada evento; compra, reembolso ou chargeback cancelam lembretes pendentes |

Migrações aplicadas: ver `supabase/migrations/` e o histórico de migrações no painel do Supabase.
