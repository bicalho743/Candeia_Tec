# Claude para gerenciar os apps iOS e Android

Este documento descreve como usar o Claude para gerenciar os aplicativos da Candeia Tec (iOS e Android), com dois caminhos possíveis.

Apps encontrados no Codemagic: **Multiplicamente** e **meu-studio-em-dia**.

---

## Opção 1: Claude Code (funciona hoje, sem desenvolvimento)

A sessão do Claude Code já está conectada ao **Codemagic** (`api.codemagic.io`) e ao **Expo** (`api.expo.dev`). Basta pedir em linguagem natural.

Exemplos de pedidos:

- "Qual o status do último build do Multiplicamente?"
- "Dispara um build iOS e Android do meu-studio-em-dia"
- "Por que o build falhou?" (o Claude lê o log e corrige o código, se for o caso)
- "Atualiza a versão para 1.2.0 e gera um novo build"
- Ajustes de ícones, textos e configurações no repositório dos apps

**Vantagens:** já funciona, não precisa programar nem guardar chaves novas.
**Limitação:** o uso acontece no Claude Code (app ou web), não dentro do Hub.

---

## Opção 2: Chat do Claude dentro do Hub (exige desenvolvimento)

O Hub (`/hub/`) é um site estático (GitHub Pages + Firestore). Por isso **a chave da API do Claude não pode ficar no navegador**, porque qualquer pessoa conseguiria copiá-la. A arquitetura precisa de um backend.

### Arquitetura

```
Hub (/hub/, login Google)
   │  mensagem + token do Firebase Auth
   ▼
Backend (Firebase Cloud Function ou Supabase Edge Function)
   │  guarda as chaves com segurança
   ├──► API do Claude (Anthropic) com "tools"
   │        │
   │        ▼  o Claude decide qual ferramenta chamar
   ├──► Codemagic API      → builds, status, logs
   ├──► Expo / EAS API     → builds, submissions, updates OTA
   ├──► App Store Connect  → TestFlight, versões, avaliações
   └──► Google Play API    → faixas de teste, publicação, avaliações
```

### Componentes

| Peça | O que faz |
|---|---|
| Tela de chat no Hub | Nova página/aba no `/hub/`, protegida pelo login Google que já existe |
| Função de backend | Recebe a mensagem, valida o usuário, conversa com o Claude e executa as ferramentas |
| Ferramentas (tools) | Funções que chamam as APIs do Codemagic, Expo, App Store Connect e Google Play |
| Confirmação de ações | Ações com efeito (publicar, disparar build) pedem confirmação antes de executar |

### Credenciais necessárias (guardadas só no backend)

- `ANTHROPIC_API_KEY`: chave da API do Claude
- Token da API do Codemagic
- Token de acesso do Expo
- Chave `.p8` da **App Store Connect API** (Issuer ID + Key ID)
- Conta de serviço (JSON) do **Google Play Developer API**

### Custos

- API do Claude: cobrança por uso (volume de texto processado)
- Firebase Cloud Functions exige o plano Blaze (pago por uso). Supabase Edge Functions tem plano gratuito.

---

## Limites (valem para as duas opções)

Algumas etapas das lojas continuam manuais:

- Aceitar contratos e termos novos da Apple e do Google
- Certas respostas à revisão da Apple
- O primeiro envio de um app novo para revisão
- Preencher formulários de conformidade (privacidade de dados, classificação etária)

---

## Recomendação

1. Comece pela **Opção 1**, que já funciona.
2. Se fizer falta ter isso dentro do Hub, implemente a **Opção 2** em etapas:
   1. Backend com consulta de status (Codemagic + Expo), só leitura
   2. Disparo de builds, com confirmação
   3. App Store Connect e Google Play (TestFlight, faixas de teste, avaliações)
