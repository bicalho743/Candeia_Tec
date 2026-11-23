# Plano: CRM próprio, atendimento automático e recuperação de vendas

Versão 1 — 23/11/2026. Documento para o Solano e para os agentes (OpenBot e Claude Code).
Quem executa cada passo está indicado. Nada aqui envia mensagem a cliente sem aprovação do Solano.

---

## 1. O que existe hoje (verificado)

### Repositórios

| Repositório | O que é de verdade | Serve para o CRM? |
|---|---|---|
| `tamara-whatsapp-bot` | Bot próprio em Node.js (Railway). Recebe a mensagem, gera resposta com IA usando a "Alma" da Tâmara (pasta `brain/`, assistente "Clara"), junta mensagens seguidas (debounce de 3 s), classifica intenção, sentimento e etapa do funil, e avisa no Telegram quando precisa de humano. Depende de **Z-API** (WhatsApp não oficial) e **Make.com**, que gravam no **Airtable** ("Coruja CRM"). O módulo `supabase.js` existe, mas não é chamado. | **Sim. É a melhor base para o bot.** |
| `Candeia_Tec` | Site candeiatec.com.br (GitHub Pages) + Hub interno com login Google e dados no Firestore. Tem catálogo de marcas e produtos (`assets/portfolio-data.js`, `apps/catalogo.json`) e as imagens de perfil e capa do WhatsApp prontas (`marca/whatsapp/`). Repositório **público**: nunca colocar chaves aqui. | Sim: o Hub pode ganhar a tela de leads; o catálogo alimenta a ficha de produtos do bot. |
| `tamara-site` | Site da Tâmara (Netlify). Formulários de contato e lista de espera enviam para o **n8n no Railway** (`/webhook/contato-site`, `/webhook/lista-espera`), que grava na planilha "Leads WhatsApp - Tâmara Cavalcante". Botões de WhatsApp levam a um número atendido por pessoa. | É uma fonte de leads. Basta o n8n gravar também no CRM. |
| `v4-connect-crm` | CRM multicanal completo (Next.js, Hono, BullMQ, Redis, Socket.io, Postgres; cerca de 7 serviços). WhatsApp só pela **Evolution API (não oficial)**; o WhatsApp oficial é só esboço (TODO). Sem recuperação de vendas nem Kiwify. **Marca e licença "proprietário da V4 Company".** A autenticação da API não confere assinatura (dá para forjar login). | **Não usar como base.** Pesado, inseguro, licença de terceiros. Serve só de referência de telas. |
| `CRM` | Cópia sem alterações do **Frappe CRM** (código aberto). Tem tela de WhatsApp oficial (com o app extra `frappe_whatsapp`), caixa de e-mail e captura de Facebook Lead Ads. Precisa de servidor com MariaDB e Redis (uns 2 a 4 GB de RAM). | Alternativa se quiser um CRM "de prateleira" com telas prontas. Mais caro e trabalhoso de manter. |
| `CRM_AIRTABLE` | Apesar do nome, cópia sem alterações do **Krayin CRM** (Laravel). Não tem nada de Airtable nem de WhatsApp. | Não. |

### Contas e ferramentas

- **n8n no Railway** já roda: recebe webhooks da Kiwify (compra → Meta, compra → RevenueCat) e os formulários do site da Tâmara. **É a "cola" que já existe e vamos reaproveitar.**
- **Supabase**: os dois projetos visíveis (Meu Studio em Dia, Meu Enxoval em Dia) são bancos dos apps. Conta do Solano: `Tâmara_whatsapp_bot` e `Livro_caixa_Tamara` estão **pausados**; `Financeiro_Solano` está ativo (finanças pessoais + o esquema `validacao` das vendas).
- **Webhooks da Kiwify** (levantamento de 23/11):

  | Nome | Destino | Produtos | Situação |
  |---|---|---|---|
  | Meta Purchase - Casa em Ordem | n8n `/webhook/kiwify-purchase` | Casa em Ordem | Ativo |
  | RevenueCat Acesso - Casa em Ordem | n8n `/webhook/kiwify-revenuecat` | Casa em Ordem | Ativo; não guarda vendas em banco |
  | Receptor de vendas da Kiwify | Supabase **Financeiro_Solano** (`cxdbrmjrwusgzikfyugf`, ativo), função `kiwify-webhook` | Todos | Criado em 05/11. Confere a assinatura da Kiwify e grava em `validacao.vendas` só o pedido, o produto, os valores e as UTMs. O e-mail é guardado só como código (hash): **não serve como lista de contatos**. Até 23/11: só 2 vendas lançadas à mão, nenhuma vinda da Kiwify. |
  | TEST-Kiwify-Webhook | n8n `/webhook/kiwify-test` | Todos | Teste: apagar |

  Hoje **nenhuma venda fica gravada num banco seu**. O faturamento só existe no painel da Kiwify.
- **Planilha do time** (Candeia Tec): a aba "Atendimento" existe, mas só tem o cabeçalho (Data, Canal, Dúvida/objeção, Produto, Resolvido?, Passado ao dono?, Observações).
- **Planilha "Leads WhatsApp - Tâmara Cavalcante"**:
  - A aba "Página1" registra quem mandou mensagem no WhatsApp, mas sem nome nem status.
  - As abas "Contato do Site" e "Lista de Espera" só têm testes.
  - A aba "Meta Ads" guarda métricas.
  - **Há uma linha com um código de verificação do Instagram: apagar essa linha e restringir o compartilhamento da planilha.**
- **OpenBot**: app de desktop. Os agentes só trabalham com o PC ligado. Por isso, o **atendimento de WhatsApp e os webhooks ficam na nuvem**, e os agentes do OpenBot fazem o trabalho que não é em tempo real.
- **Sem WhatsApp oficial** ainda. A Tâmara usa Z-API, que é não oficial e tem risco de bloqueio do número.

---

## 2. Decisão de arquitetura (recomendada)

**CRM próprio e enxuto, sem Brevo, reaproveitando o que já roda.**

```
 FONTES DE LEAD                          NÚCLEO (nuvem, 24h)                       SAÍDAS
 Kiwify (pix, boleto, carrinho, compra) ─┐
 Stripe / RevenueCat (teste, assinatura) ┤
 Sites (contato, lista de espera)        ├─► n8n (Railway, já existe) ──► Supabase "Candeia CRM"
 Instagram / ManyChat                    ┤        │  regras de                (contatos, eventos,
 WhatsApp (mensagens recebidas)          ┘        │  recuperação             mensagens, tarefas)
                                                  ▼                               │
                                   Bot de WhatsApp (tamara-whatsapp-bot           ├─► Tela "Leads" no Hub
                                   generalizado, várias marcas, Railway)          ├─► Aba "Leads" na planilha (espelho)
                                     │            │                               └─► Agentes do OpenBot (leem e agem)
                                     ▼            ▼
                         WhatsApp Cloud API   E-mail (Resend ou Amazon SES,
                         (Meta, oficial)      domínio próprio)
                                     │
                                     └─► Telegram: alerta de "precisa de humano"
```

Por que assim:
- **Supabase** é a fonte única de contatos. O plano gratuito basta. É Postgres puro, então o CRM é seu e não fica preso a ferramenta.
- **n8n** já existe e já recebe a Kiwify. Só ganha novos fluxos.
- O **bot** já está escrito e testado com a Tâmara. Generalizar sai mais barato que começar do zero.
- **WhatsApp oficial (Cloud API)** direto com a Meta, sem intermediário. Responder quem escreveu, dentro de 24 h, não é cobrado. Mensagens que a empresa inicia (lembrete de Pix, recuperação) usam modelos aprovados e custam centavos por mensagem.
- **E-mail próprio** por serviço de envio barato (Resend ou SES) com o domínio de cada marca. As respostas dos clientes caem nas caixas Gmail que o agente "E-mail Candeia Tec" já lê.

Custo mensal estimado no volume atual (estimativa, a confirmar):
- Railway: o que já paga, mais cerca de US$ 5 pelo bot.
- Supabase: grátis.
- Envio de e-mail: grátis até alguns milhares por mês.
- WhatsApp: centavos por mensagem iniciada pela empresa.
- IA: centavos por conversa.

O PC com OpenBot não precisa ficar ligado para o atendimento funcionar.

Alternativa se quiser telas de CRM prontas: subir o Frappe CRM (repositório `CRM`) com `frappe_whatsapp`. Custa mais (servidor de 4 GB) e a recuperação de vendas teria de ser montada com scripts dentro dele.

---

## 3. Necessidades, ponto a ponto

### 3.1 Base de contatos única (CRM)
- Tabelas: `contatos` (nome, telefone, e-mail, marca, origem, etapa, tags, consentimento de WhatsApp e e-mail, dono), `eventos` (tipo, produto, valor, link de pagamento, data), `mensagens` (canal, direção, texto, intenção, sentimento), `tarefas` (escalonamentos para humano, prazo, status).
- Um contato é identificado por telefone (formato 55DDDNÚMERO) **ou** e-mail. Fontes diferentes se juntam no mesmo contato.
- Etapas: lead novo → em conversa → checkout iniciado → pix/boleto gerado → cliente → recorrente; mais "perdido" e "não perturbe".
- **Executa:** Claude Code (cria o projeto e as tabelas). **Aprova:** Solano.

### 3.2 Entrada de leads (todas as fontes no mesmo lugar)

| Fonte | Como entra | Executa |
|---|---|---|
| Kiwify: pix gerado, boleto gerado, carrinho abandonado, compra aprovada, reembolso, chargeback | Webhook Kiwify → n8n → Supabase | Rastreamento + Claude Code |
| Stripe / RevenueCat: teste iniciado, assinatura, cancelamento | Webhook → n8n → Supabase | Claude Code |
| Sites (Tâmara, Planner, Casa em Ordem etc.) | Os webhooks do n8n que já existem passam a gravar também no Supabase | Claude Code |
| WhatsApp recebido | Cloud API → bot → Supabase | Claude Code |
| Instagram (ManyChat "AMÉM" e os próximos) | ManyChat → webhook n8n → Supabase | Rastreamento |
| Planilhas atuais | Importação única do que for real (testes descartados) | Agente de Atendimento |

### 3.3 WhatsApp oficial
1. **Solano, no site da Meta:** verificar a empresa no Gerenciador de Negócios, criar o app WhatsApp e cadastrar o número (ou números). Claude Code passa o passo a passo.
2. **Número decidido (23/11): um número só, +55 31 98742-8641, para todas as marcas.** A Tâmara sai da Z-API.
   - O bot descobre a marca pela mensagem pronta de cada link (por exemplo, "Olá! Vim do site da Tâmara"). Cada site ganha um link `wa.me/5531987428641?text=...` com o seu texto. Se não der para saber, o bot pergunta.
   - Os links do site da Tâmara (hoje para 31 99204-1112) passam para o número novo.
3. Ao entrar na API, o número sai do app comum do WhatsApp. Para um humano continuar respondendo:
   - opção (a): "coexistência" da Meta (app WhatsApp Business e API no mesmo número; confirmar no cadastro se está disponível);
   - opção (b): uma caixa de entrada (tela no Hub, ou Chatwoot/Frappe).
4. Token e webhook ficam só no cofre do Railway, nunca no chat nem no repositório.
- **Executa:** Claude Code (serviço e webhook). **Faz no site:** Solano.

### 3.4 Bot de respostas automáticas
- Generalizar `tamara-whatsapp-bot`: uma "Alma" por marca (`brain/<marca>/`), escolhida pelo número que recebeu a mensagem. A Tâmara continua com a "Clara".
- Trocar Z-API + Make + Airtable por Cloud API + Supabase. O módulo `supabase.js` já existe.
- O debounce em memória perde mensagens se o serviço reiniciar. Mover para o banco ou para o Redis.
- Ficha de produtos por marca (descrição, preço, link, onde acessa, garantia, upsell, perguntas frequentes), tirada do catálogo do Hub. Lacunas marcadas para o Solano preencher.
- Escalonamento para humano: Telegram (já funciona) + tarefa no CRM + linha na aba "Atendimento". Prazo de resposta humana sugerido: **1 dia útil**.
- **Executa:** Claude Code (código), agente Atendimento Candeia Tec (ficha e textos), Criativos (tom de voz). **Aprova:** Solano.

### 3.5 Recuperadores de venda
Todos param assim que chega "compra aprovada". Só para quem deu consentimento: o checkout coleta o telefone, e o texto de consentimento precisa estar no checkout e na política de privacidade.

| Gatilho | Ação | Canal |
|---|---|---|
| Pix gerado e não pago | Lembrete em 30 a 60 min com o link; segundo lembrete no dia seguinte | WhatsApp (modelo) + e-mail |
| Boleto gerado | Lembrete 1 dia antes do vencimento e no dia | WhatsApp + e-mail |
| Carrinho abandonado | Mensagem em 1 h; e-mail em 24 h | WhatsApp + e-mail |
| Teste grátis do Planner | 5 e-mails em 7 dias (uma ferramenta por dia) + WhatsApp no 5º dia com a oferta do anual | E-mail + WhatsApp |
| Compra aprovada | Boas-vindas + como acessar; oferta complementar no 7º dia | E-mail (+ WhatsApp) |
| Lead do site sem resposta | Resposta automática imediata no WhatsApp | WhatsApp |
| Reembolso ou chargeback | Alerta ao Solano; contato marcado | Telegram |

- Modelos de WhatsApp precisam de aprovação da Meta (1 a 2 dias). Textos: Criativos. Envio para aprovação: Claude Code.
- **Executa:** Claude Code (fluxos no n8n), Rastreamento (eventos da Kiwify), Validador (confere antes de ligar).

### 3.6 E-mail automático
- Envio: Resend ou Amazon SES com o domínio de cada marca. Configurar SPF, DKIM e DMARC; o Solano faz isso no registro do domínio, com o passo a passo.
- Respostas dos clientes: continuam indo para os Gmail. O agente "E-mail Candeia Tec" lê, responde em rascunho e registra no CRM.
- Link de descadastro em todo e-mail de marketing (LGPD).

### 3.7 Ver e centralizar os leads (painel)
- **Fase 1 (rápida):** o n8n espelha os contatos numa aba "Leads" da planilha do time. É fácil para você e para os agentes lerem.
- **Fase 2:** tela "Leads" no Hub (já tem login Google), com filtros por marca, etapa e origem, linha do tempo de cada contato (eventos e mensagens) e as tarefas de humano.

### 3.8 Papel dos agentes do OpenBot (no PC, fora do tempo real)

| Agente | O que passa a fazer |
|---|---|
| Atendimento Candeia Tec | Lê as tarefas de "precisa de humano", rascunha a resposta e mantém a ficha de produtos |
| E-mail Candeia Tec | Igual a hoje, e também registra no CRM |
| Rastreamento | Mantém os webhooks (Kiwify, Stripe, ManyChat) e confere se os eventos chegam |
| Criativos | Escreve os modelos de WhatsApp e as sequências de e-mail |
| Diretor Analista | Relatório semanal: leads por origem, conversão por etapa, vendas recuperadas |
| Validador | Confere cada fluxo com teste antes de ligar para clientes reais |

---

## 4. Ordem de execução

1. **Limpeza (já):** apagar a linha com o código do Instagram na planilha da Tâmara, restringir o compartilhamento, separar as linhas de teste e apagar o webhook de teste da Kiwify.
2. **Base:** criar o Supabase "Candeia CRM" com as tabelas, fazer o n8n gravar Kiwify e sites nele e ligar o espelho na aba "Leads".
3. **Recuperação por e-mail:** Pix, boleto e carrinho (não depende da Meta).
4. **WhatsApp oficial:** cadastro na Meta pelo Solano, enquanto Claude Code generaliza o bot.
5. **Bot no ar:** primeiro no número de suporte da Candeia Tec; depois migrar a Tâmara da Z-API.
6. **Recuperação por WhatsApp**, com os modelos aprovados.
7. **Tela de Leads no Hub** e relatório semanal.

## 5. Pendências do Solano
- [x] Número de WhatsApp: um só, 31 98742-8641; a Tâmara sai da Z-API.
- [ ] Verificação da empresa no Gerenciador de Negócios da Meta.
- [ ] Prazo de resposta humana (sugestão: 1 dia útil) e quem recebe os casos difíceis (sugestão: Telegram do Solano, como hoje).
- [ ] Ficha de produtos: Planner Organiza, Meu Studio em Dia, MultiplicaMente (descrição, preço, link, garantia).
- [ ] Em qual conta do Supabase está o projeto `cxdbrmjrwusgzikfyugf` ("Receptor de vendas"), e se é o projeto pausado do bot da Tâmara.
- [ ] Aprovar este plano (ou trocar a base para o Frappe CRM).

---

## 6. Candeia CRM: criado em 23/11/2026

- Supabase, organização "Solano Bicalho" (plano Pro), projeto **Candeia CRM** (`zottntimhhsgwsgtvguz`), região São Paulo (sa-east-1).
- Acesso: só pela chave de serviço (n8n, bot, agentes). Todas as tabelas têm RLS ligado e nenhuma regra pública. A chave fica no cofre de cada serviço, nunca no repositório (ele é público).

### Tabelas
| Tabela | Para quê |
|---|---|
| `marcas` | `candeia`, `vida`, `frei` (WhatsApp geral 5531987428641) e `tamara` (número próprio 5531992041112) |
| `produtos` | Ficha de cada produto: preço, link, onde acessa, garantia, upsell, perguntas frequentes, ids da Kiwify |
| `contatos` | Um registro por pessoa. Telefone só com dígitos e 55; e-mail em minúsculo. Etapas: lead_novo, em_conversa, checkout_iniciado, pagamento_pendente, cliente, recorrente, perdido. Guarda o consentimento de WhatsApp e de e-mail e o "não perturbe" |
| `eventos` | Tudo o que aconteceu: lead de formulário, mensagem, carrinho, Pix, boleto, compra, reembolso, teste, assinatura. O mesmo pedido não entra duas vezes (fonte + pedido + tipo) |
| `mensagens` | Histórico de WhatsApp, e-mail e Instagram (quem escreveu: cliente, bot, humano ou automação) |
| `tarefas` | Casos para humano, com prazo e status |
| `envios_programados` | Fila dos recuperadores e sequências (fluxo, canal, horário, status) |
| `vw_leads` | Visão pronta para o painel e a planilha: contato + último evento + tarefas abertas + total comprado |

### Regras automáticas (no banco)
- `upsert_contato(telefone, email, nome, marca, origem, whatsapp_optin, email_optin, utm)`: cria ou atualiza o contato. Se o telefone e o e-mail estavam em contatos diferentes, junta os dois (`mesclar_contatos`) com todo o histórico. Uso pelo n8n: `POST /rest/v1/rpc/upsert_contato`.
- Cada novo evento atualiza a etapa do contato. "Compra aprovada", "reembolso" ou "chargeback" cancelam na hora os lembretes pendentes de Pix, boleto e carrinho.
- Testado em 23/11 com um contato fictício (apagado depois): a junção, a mudança de etapa e o cancelamento do lembrete funcionaram.

### Integração com a Kiwify (n8n)
- Fluxo **"CRM — Kiwify (todos os produtos e eventos)"** (id `DMCkVjYUBHrmDvji`), **ativo** desde 23/11. Testado com um pedido real (gravou contato e evento, marca certa) e com um pedido falso (recusado, nada gravado). Endereço: `https://n8n-production-8a4b.up.railway.app/webhook/kiwify-crm`.
- Pedidos são conferidos na API da Kiwify antes de gravar. Avisos falsos não entram, e o link/código de Pix nunca é tirado do aviso.
- Carrinho abandonado não tem como ser conferido: entra marcado `verificado: false`. **Nenhuma mensagem automática deve ser enviada para evento não verificado** até a conferência da assinatura da Kiwify estar ligada.
- Função no CRM: `registrar_evento(...)`. Cria ou junta o contato, grava o evento sem duplicar e descobre a marca pelo id do produto na Kiwify (tabela `produtos`).
- Credencial do CRM no n8n: "Supabase account" (tipo Supabase API), cadastrada pelo Solano.
- Falta: (1) cadastrar na Kiwify o webhook `kiwify-crm` para todos os produtos e eventos (agente com acesso à Kiwify); (2) preencher os ids da Kiwify dos outros produtos na tabela `produtos`.

### Próximos passos técnicos
1. n8n: formulários dos sites gravando no CRM.
2. n8n: rotina a cada 5 min que envia os `envios_programados` vencidos (e-mail primeiro).
3. Aba "Leads" na planilha do time, espelhando `vw_leads`.
4. Bot de WhatsApp lendo e gravando no CRM.

---

## 7. Situação em 23/11/2026 (fim do dia)

### Decisões do Solano
- Número geral 31 98742-8641 (WhatsApp Business) para Candeia Tec, Vida em Método e Frei Miguel, **mantido também no celular** (coexistência, por um parceiro oficial da Meta).
- Tâmara: número próprio 31 99204-1112. Casa em Ordem é da **Tâmara**, e os lembretes dele saem pelo número dela, desde que ela também mantenha o número no celular (coexistência).
- CRM próprio no Supabase (plano Pro), sem Brevo.

### Feito
- Candeia CRM criado, com tabelas, regras e testes (seção 6).
- n8n:
  - "CRM — Kiwify (todos os produtos e eventos)": ativo e testado.
  - "Tâmara — Contato do Site" e "Tâmara — Lista de Espera": passam a gravar também no CRM, em paralelo (se o CRM falhar, o Airtable e a planilha seguem normais).
  - "CRM — Espelho da aba Leads" (id `yhggMM07Ofl6zLMU`): a cada 15 min reescreve a aba **Leads** da planilha do time a partir de `vw_leads`. **Não editar a aba à mão**: ela é apagada e reescrita.
  - "Temp — HTTP Proxy" **desligado** (deixava qualquer pessoa usar o servidor do n8n como intermediário).
- Produto Casa em Ordem cadastrado na marca `tamara`.

### Pendente
- [ ] Cadastrar na Kiwify o webhook `https://n8n-production-8a4b.up.railway.app/webhook/kiwify-crm` (todos os produtos e eventos). Apagar o "TEST-Kiwify-Webhook".
- [ ] Ids da Kiwify dos demais produtos na tabela `produtos`.
- [ ] Confirmar se o 31 99204-1112 (Tâmara) está no app WhatsApp Business. É requisito da coexistência; hoje ele está ligado à Z-API, que será desligada na migração.
- [ ] Escolher o parceiro de coexistência (confirmar preço e se aceita os dois números).
- [ ] Lembretes por e-mail (Pix, boleto, carrinho): escolher o serviço de envio (Resend ou SES) e autenticar os domínios.
- [ ] Ligar a conferência da assinatura da Kiwify antes de qualquer mensagem automática para carrinho abandonado.
