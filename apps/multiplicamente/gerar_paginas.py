"""Gera as páginas do MultiplicaMente em candeiatec.com.br/apps/multiplicamente/."""
import sys
from pathlib import Path

RAIZ = Path(sys.argv[1]) / "apps" / "multiplicamente"
BASE = "https://candeiatec.com.br/apps/multiplicamente/"
EMAIL = "contato@candeiatec.com.br"
PLAY = "https://play.google.com/store/apps/details?id=com.solano.multiplicamente"
DATA = "17 de novembro de 2026"

def pagina(pasta, titulo, descricao, corpo):
    prof = "../../" if pasta == "" else "../../../"
    aqui = "./" if pasta == "" else "../"
    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{titulo} — MultiplicaMente</title>
<meta name="description" content="{descricao}">
<link rel="canonical" href="{BASE}{pasta + '/' if pasta else ''}">
<link rel="icon" type="image/svg+xml" href="{prof}assets/candeia-tec-logo.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{prof}assets/site.css">
</head>
<body>

<header class="top">
  <div class="wrap">
    <a class="logo" href="{prof}"><img src="{prof}assets/candeia-tec-logo.svg" alt="" width="34" height="34">Candeia Tec</a>
    <nav class="nav">
      <a href="{aqui}">MultiplicaMente</a>
      <a href="{aqui}suporte/">Suporte</a>
      <a href="{aqui}privacidade/">Privacidade</a>
    </nav>
  </div>
</header>

<main class="doc">
{corpo}
</main>

<footer>
  <div class="wrap">
    <span>© 2026 Candeia Tec</span>
    <nav>
      <a href="{aqui}privacidade/">Política de privacidade</a>
      <a href="{aqui}termos/">Termos de uso</a>
      <a href="{aqui}excluir-conta/">Excluir conta</a>
      <a href="{aqui}suporte/">Suporte</a>
    </nav>
  </div>
</footer>
</body>
</html>
"""
    destino = RAIZ / pasta / "index.html" if pasta else RAIZ / "index.html"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(html, encoding="utf-8")
    print("ok", destino)

pagina("", "Aprender a tabuada brincando", "MultiplicaMente: jogo educativo de tabuada para crianças de 6 a 10 anos. Sem anúncios, funciona sem internet.", f"""  <h1>MultiplicaMente</h1>
  <div class="upd">Aventura da Tabuada · aplicativo da Candeia Tec</div>
  <p class="lead">Jogo educativo em que a criança aprende a tabuada brincando: cada tabuada é uma fase, cada vitória resgata uma criatura e os pais acompanham o progresso em um relatório protegido por PIN.</p>
  <ul>
    <li>Multiplicação, divisão, adição e subtração, do 2 ao 10</li>
    <li>180 criaturas para colecionar, combos, missões diárias e dias seguidos</li>
    <li>Sem anúncios e funciona sem internet</li>
    <li>Tabuadas do 2 ao 6 grátis; o Premium libera do 7 ao 10 com pagamento único</li>
  </ul>
  <p style="margin-top:18px"><a class="btn btn-p" href="{PLAY}" target="_blank" rel="noopener">Baixar no Google Play</a></p>
  <p>A versão para iPhone e iPad está em análise na App Store.</p>
  <h2>Ajuda e documentos</h2>
  <ul>
    <li><a href="suporte/">Suporte e perguntas frequentes</a></li>
    <li><a href="privacidade/">Política de privacidade</a></li>
    <li><a href="termos/">Termos de uso</a></li>
    <li><a href="excluir-conta/">Como excluir a conta e os dados</a></li>
  </ul>
  <div class="box"><p>Contato: <a href="mailto:{EMAIL}">{EMAIL}</a></p></div>""")

pagina("suporte", "Suporte", "Suporte do MultiplicaMente: perguntas frequentes e contato.", f"""  <h1>Suporte</h1>
  <div class="upd">MultiplicaMente · Última atualização: {DATA}</div>
  <p class="lead">Precisa de ajuda com o MultiplicaMente? Veja as respostas abaixo ou escreva para a gente.</p>
  <div class="box"><p>E-mail de suporte: <a href="mailto:{EMAIL}?subject=Suporte%20MultiplicaMente">{EMAIL}</a><br>Respondemos em até 5 dias úteis. Conte o modelo do aparelho e o que aconteceu.</p></div>

  <h2>Perguntas frequentes</h2>
  <h3>Preciso criar uma conta para jogar?</h3>
  <p>Não. Toque em "Novo jogador", escolha o nome e um PIN de 4 números (definido por um adulto) e comece. A conta é opcional e serve só para guardar o progresso na nuvem e usar em mais de um aparelho.</p>
  <h3>O que é o PIN dos pais?</h3>
  <p>É a senha de 4 números criada junto com o perfil. Ela protege o relatório de desempenho. Compras, conta e exclusão de perfil também pedem uma confirmação de adulto.</p>
  <h3>O que o Premium libera?</h3>
  <p>As tabuadas do 2 ao 6 são grátis. O Premium libera as tabuadas do 7 ao 10 em todas as operações, com pagamento único, sem assinatura. Ele vale para todos os perfis do aparelho.</p>
  <h3>Comprei o Premium e ele não aparece. O que faço?</h3>
  <p>No app, abra Config e toque em "Já comprei · Restaurar compra", usando a mesma conta da loja (Google Play ou App Store) em que a compra foi feita.</p>
  <h3>Como peço reembolso?</h3>
  <p>O pagamento é processado pela loja. Peça o reembolso pelo Google Play ou pela Apple, na conta usada na compra. Se precisar de ajuda, escreva para o e-mail de suporte.</p>
  <h3>Troquei de celular. Como levo o progresso?</h3>
  <p>No aparelho antigo, em Config, toque em "Entrar para salvar na nuvem" e crie uma conta. No aparelho novo, entre com a mesma conta.</p>
  <h3>Como apago um perfil ou excluo a conta?</h3>
  <p>Veja o passo a passo em <a href="../excluir-conta/">Excluir conta e dados</a>.</p>
  <h3>O app tem anúncios ou conversa entre usuários?</h3>
  <p>Não. O app não mostra anúncios e não tem chat nem contato entre usuários.</p>""")

pagina("excluir-conta", "Excluir conta e dados", "Como excluir a conta e os dados do MultiplicaMente.", f"""  <h1>Excluir conta e dados</h1>
  <div class="upd">MultiplicaMente · Candeia Tec · Última atualização: {DATA}</div>
  <p class="lead">A conta do MultiplicaMente é opcional e serve só para guardar o progresso na nuvem. O responsável pode excluí-la a qualquer momento, por um destes dois caminhos.</p>

  <h2>1. Pelo aplicativo (na hora)</h2>
  <ol>
    <li>Abra o MultiplicaMente e entre em um perfil.</li>
    <li>Toque na aba <b>Config</b>.</li>
    <li>Em <b>Conta e sincronização</b>, toque em <b>Excluir conta e dados da nuvem</b>.</li>
    <li>Responda à confirmação de adulto e toque em <b>Sim, excluir minha conta</b>.</li>
  </ol>
  <p>Quem entrou com a Apple precisa confirmar mais uma vez com a Apple antes da exclusão.</p>

  <h2>2. Por e-mail</h2>
  <p>Escreva para <a href="mailto:{EMAIL}?subject=Excluir%20conta%20MultiplicaMente">{EMAIL}</a> com o assunto "Excluir conta MultiplicaMente", usando ou informando o e-mail da conta. Atendemos em até 5 dias úteis.</p>

  <h2>O que é excluído</h2>
  <ul>
    <li>A conta (e-mail e identificador de acesso).</li>
    <li>Todos os perfis e o progresso guardados na nuvem (nome do jogador, estrelas, gemas, criaturas e histórico de partidas).</li>
  </ul>

  <h2>O que não é excluído automaticamente</h2>
  <ul>
    <li><b>Dados guardados no aparelho:</b> os perfis continuam no celular, sem vínculo com a nuvem. Para removê-los, apague o perfil no app (toque no nome do jogador e em "Apagar este perfil") ou desinstale o aplicativo.</li>
    <li><b>Compra do Premium:</b> o registro da compra fica com a loja (Google Play ou App Store), que tem as próprias regras de guarda. A Candeia Tec não guarda dados de pagamento.</li>
  </ul>
  <p>Não mantemos cópia dos dados da conta depois da exclusão.</p>""")

pagina("termos", "Termos de uso", "Termos de uso do MultiplicaMente, aplicativo da Candeia Tec.", f"""  <h1>Termos de Uso</h1>
  <div class="upd">MultiplicaMente · Última atualização: {DATA}</div>
  <p class="lead">O MultiplicaMente é um aplicativo da Candeia Tec. Valem para ele os <a href="../../../termos/">Termos de Uso da Candeia Tec</a>, com os pontos específicos abaixo.</p>

  <h2>Uso por crianças</h2>
  <p>O app é feito para crianças a partir de 6 anos, mas deve ser instalado e configurado por um responsável. É o responsável quem cria o PIN, faz as compras e, se quiser, cria a conta.</p>

  <h2>Conta</h2>
  <p>O app funciona sem conta. A conta é opcional, criada pelo responsável, e serve só para guardar o progresso na nuvem. Ela pode ser excluída a qualquer momento: veja <a href="../excluir-conta/">Excluir conta e dados</a>.</p>

  <h2>Compras</h2>
  <p>As tabuadas do 2 ao 6 são gratuitas. O Premium libera as tabuadas do 7 ao 10 com pagamento único, sem assinatura, processado pelo Google Play ou pela App Store. Reembolsos seguem as regras da loja e o Código de Defesa do Consumidor.</p>

  <h2>Conteúdo e conduta</h2>
  <p>O app não tem anúncios, chat nem conteúdo enviado por usuários. Os nomes de jogador ficam visíveis apenas no próprio aparelho e na conta do responsável.</p>

  <h2>Privacidade</h2>
  <p>O tratamento de dados está descrito na <a href="../privacidade/">Política de Privacidade do MultiplicaMente</a>.</p>

  <div class="box"><p>Dúvidas sobre estes termos: <a href="mailto:{EMAIL}">{EMAIL}</a></p></div>""")

pagina("privacidade", "Política de privacidade", "Política de privacidade do MultiplicaMente, aplicativo de tabuada para crianças.", f"""  <h1>Política de Privacidade</h1>
  <div class="upd">MultiplicaMente — Aventura da Tabuada · Última atualização: {DATA}</div>

  <h2>Visão geral</h2>
  <p>O MultiplicaMente é um aplicativo educacional de matemática desenvolvido para crianças. Levamos a privacidade dos nossos usuários, especialmente de menores de idade, muito a sério.</p>
  <p>Este aplicativo é destinado a crianças a partir de 6 anos e foi desenvolvido em conformidade com a Lei Geral de Proteção de Dados (LGPD) e o Marco Civil da Internet.</p>

  <h2>Dados coletados</h2>
  <p>O MultiplicaMente coleta apenas os dados estritamente necessários para o funcionamento do aplicativo:</p>
  <ul>
    <li><b>Nome do jogador</b>: definido pelos pais ou responsáveis no momento da criação do perfil</li>
    <li><b>Progresso no jogo</b>: estrelas, gemas, criaturas desbloqueadas, histórico de partidas</li>
    <li><b>E-mail e conta Google ou Apple</b>: apenas quando o responsável opta por criar uma conta para sincronização na nuvem (opcional)</li>
  </ul>
  <div class="box"><p>Não coletamos dados de localização, contatos, câmera, microfone ou qualquer informação sensível.</p></div>

  <h2>Como usamos os dados</h2>
  <ul>
    <li>Salvar o progresso do jogador no dispositivo (armazenamento local)</li>
    <li>Sincronizar o progresso na nuvem quando o responsável cria uma conta (opcional)</li>
    <li>Exibir estatísticas de desempenho para os pais ou responsáveis</li>
  </ul>
  <p>Não utilizamos os dados para publicidade, não vendemos dados a terceiros e não compartilhamos informações com anunciantes.</p>

  <h2>Armazenamento e segurança</h2>
  <ul>
    <li>Os dados locais são armazenados apenas no dispositivo do usuário</li>
    <li>Quando a sincronização na nuvem é ativada, os dados são armazenados de forma segura no Google Firebase, com autenticação obrigatória</li>
    <li>Cada usuário acessa apenas seus próprios dados: não há acesso cruzado entre contas</li>
    <li>Utilizamos criptografia padrão do setor para proteger todas as transmissões de dados</li>
  </ul>

  <h2>Proteção de menores</h2>
  <p>O MultiplicaMente foi desenvolvido especificamente para uso infantil sob supervisão de pais e responsáveis:</p>
  <ul>
    <li>Não há comunicação entre usuários (sem chat, sem fórum)</li>
    <li>Não há publicidade de terceiros no aplicativo</li>
    <li>Não há compras realizadas pela criança sem ação do responsável</li>
    <li>O PIN dos pais protege o acesso ao painel de desempenho e configurações</li>
    <li>Compras premium (compra dentro do app) requerem confirmação do responsável pela Google Play (Android) ou pela App Store (iPhone e iPad)</li>
  </ul>

  <h2 id="exclusao">Exclusão de dados</h2>
  <p>Os responsáveis podem a qualquer momento:</p>
  <ul>
    <li>Apagar o perfil da criança diretamente no aplicativo</li>
    <li>Excluir a conta e todos os dados da nuvem pelo próprio aplicativo: Config → Conta e sincronização → Excluir conta e dados da nuvem</li>
    <li>Solicitar a exclusão da conta e dos dados pelo e-mail abaixo, informando o e-mail da conta (atendemos em até 5 dias úteis)</li>
    <li>Desinstalar o aplicativo para remover todos os dados locais</li>
  </ul>
  <p>Passo a passo em <a href="../excluir-conta/">Excluir conta e dados</a>.</p>

  <h2>Contato</h2>
  <p>Para dúvidas, solicitações de exclusão de dados ou qualquer questão relacionada à privacidade, entre em contato:</p>
  <div class="box"><p><a href="mailto:{EMAIL}">{EMAIL}</a><br>Responderemos em até 5 dias úteis.</p></div>

  <h2>Atualizações desta política</h2>
  <p>Esta política pode ser atualizada periodicamente. Em caso de alterações significativas, o usuário será notificado dentro do aplicativo. O uso continuado do aplicativo após as alterações implica na aceitação da nova política.</p>""")
