# 🦉 Coruja Labs — Hub

Painel de gestão dos produtos, marcas, contatos, domínios, infoprodutos, sites e empresas.
Página inicial: **Portfólio**. Dados salvos no Firestore (`hubs/{uid}.portfolio`).

| Página | O que mostra |
|---|---|
| Produtos | Cards por marca com saúde (crítico/atenção/em dia), alertas, checklist de domínio, contatos e próxima ação. Clique abre o painel de edição. |
| Infoprodutos | Produtos do Kiwify por marca, preço, checkout e landing (editável). |
| Sites | Correções de cada site com prioridade e arquivo a alterar. |
| Empresas | Estrutura CNPJ 1 (serviços) / CNPJ 2 (produtos digitais) e plano de migração. |

Arquivos: `assets/portfolio-data.js` (dados iniciais, usados só se o Firestore ainda não tiver portfólio), `assets/portfolio.js`, `assets/theme.css`.

---

# 📊 Coruja Labs — Métricas Windsor.ai

Módulo de coleta e visualização de métricas de redes sociais via [Windsor.ai](https://windsor.ai).

## Estrutura

```
corujalabs-hub/
├── metrics/
│   ├── fetch_metrics.py      ← script de coleta
│   └── requirements.txt
├── dashboard/
│   └── index.html            ← dashboard local (abre no browser)
├── data/                     ← JSONs gerados (gitignore sensível)
│   └── tamara_metrics.json
└── .github/
    └── workflows/
        └── fetch_metrics.yml ← roda todo dia às 06h BRT
```

## Setup

### 1. Variável de ambiente — WINDSOR_API_KEY

No Railway (ou `.env` local):

```
WINDSOR_API_KEY=sua_chave_aqui
```

> Encontre sua chave em: **Windsor.ai → Settings → API Key**

### 2. No GitHub Actions

Em `Settings → Secrets and variables → Actions`, adicione:

| Nome | Valor |
|------|-------|
| `WINDSOR_API_KEY` | sua chave Windsor |

### 3. Rodar localmente

```bash
cd corujalabs-hub
pip install -r metrics/requirements.txt

# Tâmara — últimos 30 dias
python metrics/fetch_metrics.py --persona tamara --days 30

# Últimos 7 dias
python metrics/fetch_metrics.py --persona tamara --days 7
```

O JSON é salvo em `data/tamara_metrics.json`.

### 4. Visualizar o dashboard

Abra `dashboard/index.html` diretamente no browser (ou sirva com Live Server no VS Code).

## Personas configuradas

| Chave | Persona | Plataforma | Account ID |
|-------|---------|------------|------------|
| `tamara` | Tâmara Cavalcante | Instagram | 17841410001362576 |

Para adicionar novas personas, edite o dicionário `PERSONAS` em `metrics/fetch_metrics.py` e adicione a opção no `<select>` do `dashboard/index.html`.

## Métricas coletadas

**Nível de conta (diário):**
`followers_count`, `follower_count_1d`, `reach_1d`, `accounts_engaged`, `likes`, `comments`, `saves`, `shares`, `total_interactions`, `views`, `profile_views_1d`

**Nível de post (por mídia):**
`timestamp`, `media_type`, `media_product_type`, `media_caption`, `media_reach`, `media_views`, `media_engagement`, `media_saved`, `media_shares`, `media_comments_count`, `media_like_count`, `media_permalink`

## Automação (GitHub Actions)

O workflow `.github/workflows/fetch_metrics.yml`:
- Roda automaticamente todo dia às **06:00 BRT**
- Faz commit do JSON atualizado se houver mudança
- Pode ser disparado manualmente em **Actions → Fetch Windsor Metrics → Run workflow**
