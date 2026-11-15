# Padrão dos apps da Candeia Tec

Regras para que todos os apps tenham as mesmas informações, nos mesmos formatos, no Google Play e na App Store.

- **Dados de cada app:** [`catalogo.json`](catalogo.json) (fonte única).
- **Visão de conferência:** página **Apps nas lojas** no Hub (`/hub/`), que pinta cada campo de verde (ok), amarelo (fora do padrão), vermelho (falta) ou cinza (não se aplica).
- **Planilha:** [`STATUS_APLICATIVOS.xlsx`](STATUS_APLICATIVOS.xlsx), gerada por `python apps/gerar_planilha.py`.

> **Nunca coloque senhas** no catálogo, na planilha ou em qualquer arquivo deste repositório: ele é **público**. Registre só *onde* a senha está (ex.: "Bitwarden › Candeia Tec › Play Console").

Convenção de preenchimento: campo vazio ou `xxxx` = sem informação (pendente); `n/a` = não se aplica.

---

## 1. Padrão Candeia Tec

| Item | Padrão |
|---|---|
| Copyright | `© 2026 Candeia Tec` (com o símbolo ©, não @; atualizar o ano a cada versão nova) |
| Desenvolvedor exibido nas lojas | **Solano Bicalho** hoje (conta pessoal). Passa a ser **Candeia Tec** quando houver conta de organização (CNPJ + D-U-N-S) e os apps forem transferidos |
| E-mail de suporte (público) | `contato@<domínio do app>`, redirecionando para uma caixa central. Os Gmail de cada app ficam só para login |
| Política de privacidade | `https://<domínio>/privacidade/` |
| Termos de uso | `https://<domínio>/termos/` |
| Excluir conta | `https://<domínio>/excluir-conta/` (todo app com conta) |
| Suporte | `https://<domínio>/suporte/` (obrigatória na App Store) |
| App sem domínio próprio | páginas em `https://candeiatec.com.br/apps/<slug>/privacidade/` etc. |
| Pacote de apps novos | `br.com.candeiatec.<app>`; os já publicados não mudam (o pacote é permanente) |
| Nome na loja | `Nome: benefício`, até 30 caracteres (ex.: "Enxoval em Dia: Lista do Bebê") |

---

## 2. Google Play — o que cada app precisa

**Textos da página**
- Nome do app: até **30** caracteres
- Descrição curta: até **80**
- Descrição completa: até **4.000**

**Imagens**
- Ícone 512×512 PNG
- Gráfico de destaque 1024×500
- **2 a 8** capturas de tela de celular (tablet 7" e 10" opcionais)
- Vídeo no YouTube (opcional)

**Conteúdo do app (Play Console › Política › Conteúdo do app)**
- Política de privacidade (URL)
- Acesso ao app: conta de teste para a revisão, se houver login
- Anúncios: sim ou não
- Classificação de conteúdo (questionário IARC)
- Público-alvo e conteúdo. Se atender crianças, entra na **Política para Famílias**: sem anúncios inadequados e sem coleta de dados de crianças
- **Segurança dos dados:** o que coleta, por quê e se compartilha
- **Exclusão de conta:** link web obrigatório se o app tem conta
- Declarações de permissões sensíveis e do ID de publicidade

**Requisitos técnicos e de conta**
- **Target SDK:** novos apps e atualizações precisam ter **API 36 (Android 16) desde 31/08/2026**
- **Teste fechado:** contas pessoais criadas após 13/11/2023 precisam de **12 testadores por 14 dias seguidos** antes da produção, em cada app novo. Contas de organização são isentas
- Assinatura: Play App Signing ativado; keystore de upload guardada fora do repositório (só o caminho e o alias no catálogo)

---

## 3. App Store — o que cada app precisa

**Textos da página**
- Nome: até **30** caracteres
- Subtítulo: até **30**
- Texto promocional: até **170** (muda sem nova versão)
- Descrição: até **4.000**
- Palavras-chave: até **100** caracteres, separadas por vírgula

**URLs**
- **Suporte:** obrigatória
- **Privacidade:** obrigatória
- Marketing: opcional

**Imagens**
- Ícone 1024×1024 sem transparência
- Capturas de tela **iPhone 6,9" (1320×2868)**
- iPad 13" (2064×2752), se o app roda no iPad
- Prévia em vídeo (opcional)

**Conformidade (App Store Connect)**
- **Privacidade do app** ("rótulo nutricional")
- **Classificação etária** no questionário novo, com as faixas 4+, 9+, 13+, 16+ e 18+
- Criptografia (export compliance)
- Comerciante na UE (DSA), se vender lá
- **Entrar com a Apple:** obrigatório se o app oferece login com Google ou outro serviço
- **Excluir conta dentro do app:** a Apple exige que a exclusão comece no próprio app
- Conta de teste para a revisão, se houver login
- Compras digitais pelo **StoreKit** (compra no app da Apple)

---

## 4. Checklist antes de publicar uma versão

1. Catálogo atualizado (versão, textos, links) e página **Apps nas lojas** sem vermelho no app.
2. Copyright, desenvolvedor e e-mail de suporte iguais ao padrão.
3. Links de privacidade, termos, exclusão de conta e suporte abrindo (testar no celular).
4. Target SDK em dia (Android) e questionários de classificação respondidos (Play e Apple).
5. Segurança dos dados (Play) e Privacidade do app (Apple) batendo com a política de privacidade.
6. Capturas de tela e textos iguais em sentido nas duas lojas (mesma promessa, mesmo preço).
7. Gerar a planilha: `python apps/gerar_planilha.py`.

---

## Fontes (consultadas em 15/11/2026)

- Google Play — [Requisitos de nível de API de destino](https://support.google.com/googleplay/android-developer/answer/11926878) · [Target SDK](https://developer.android.com/google/play/requirements/target-sdk)
- Google Play — [Requisitos de teste para contas pessoais novas](https://support.google.com/googleplay/android-developer/answer/14151465)
- Apple — [Classificações etárias atualizadas no App Store Connect](https://developer.apple.com/news/?id=ks775ehf)
- Apple — Especificações de capturas de tela (App Store Connect Help), conferidas em guias atualizados como [este](https://studio.adalo.com/blog/app-store-screenshot-sizes-2026)

Regras das lojas mudam. Antes de cada publicação, confira a página de política do Play Console e os avisos do App Store Connect.
