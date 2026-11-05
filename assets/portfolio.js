/* Portfólio — gestão de produtos, marcas, contatos, domínios, infoprodutos, sites e empresas.
   Depende de: D, save(), safeText(), projHref(), openProj(), go() do index.html */

const PF_STATUS = {
  ideia:    {l:'Ideia',         c:'n'},
  rascunho: {l:'Rascunho',      c:'b'},
  teste:    {l:'Teste fechado', c:'p'},
  producao: {l:'Produção',      c:'g'},
  ativo:    {l:'Vendendo',      c:'g'},
  pausado:  {l:'Pausado',       c:'a'},
};
const PF_TIPOS = ['App','App + SaaS','SaaS B2B','Infoproduto','Serviço','Persona de conteúdo'];
const PF_CONTACT_FIELDS = [
  ['email','E-mail operacional','Gmail que recebe tudo'],
  ['emailPub','E-mail público','contato@dominio — vai na ficha do Play e no site'],
  ['instagram','Instagram','@usuario'],
  ['whatsapp','WhatsApp','(31) 9…'],
  ['dominio','Domínio','produto.com.br'],
  ['site','Site / landing','URL da landing'],
  ['checkout','Checkout / loja','Kiwify, Play, Stripe…'],
  ['repo','Repositório','github.com/…'],
  ['pacote','Pacote (Play)','com.empresa.app'],
];
const PF_CK_LBL = {p:'Pendente', f:'Feito', na:'N/A'};

let pfView = {marca:'', saude:'', tipo:'', q:'', mode:'cards'};
try{ const v=JSON.parse(localStorage.getItem('corujalabs_pf_view')||'null'); if(v) pfView=Object.assign(pfView,v,{q:''}); }catch(e){}
function pfSaveView(){ try{localStorage.setItem('corujalabs_pf_view',JSON.stringify(pfView));}catch(e){} }

let pfOpenId = null, pfTab = 'geral';

/* ---------- dados ---------- */
function pfEnsure(){
  let changed = false;
  if(!D.portfolio || !Array.isArray(D.portfolio.produtos)){
    D.portfolio = JSON.parse(JSON.stringify(PORTFOLIO_SEED));
    changed = true;
  }
  const P = D.portfolio;
  ['marcas','produtos','kiwify','correcoes','empresas','etapas'].forEach(k=>{ if(!Array.isArray(P[k])) P[k]=JSON.parse(JSON.stringify(PORTFOLIO_SEED[k])); });
  if(!P.holding) P.holding = JSON.parse(JSON.stringify(PORTFOLIO_SEED.holding));
  P.produtos.forEach(p=>{ if(!p.check) p.check = pfCheck(); PF_CHECK_STEPS.forEach(([k])=>{ if(!p.check[k]) p.check[k]='p'; }); });
  if(pfMigrate(P)) changed = true;
  return changed;
}

/* Atualizações de dados aplicadas uma vez sobre o que já está salvo (idempotentes). */
function pfMigrate(P){
  const v = P.seedVersion || 1;
  if(v >= 2) return false;
  const prod = id => P.produtos.find(x=>x.id===id);
  const kw = id => P.kiwify.find(x=>x.id===id);
  const fix = id => P.correcoes.find(x=>x.id===id);
  const setP = (id, obj, ck) => { const p=prod(id); if(!p) return; Object.assign(p, obj); if(ck) Object.assign(p.check, ck); };

  // 05/11/2026 — correções publicadas em tamara-site, landing do Frei Miguel e Casa em Ordem
  ['c3','c4','c5','c7','c8','c9','c10','c11','c12','c13','c14','c15','c16','c17','c18','c19','c20'].forEach(id=>{ const c=fix(id); if(c) c.ok=true; });
  const c15=fix('c15'); if(c15){ c15.txt='E-mail ofuscado pelo Cloudflare'; c15.fix='Removido: contato@tamaraorganiza.com.br não recebe e-mail (domínio sem MX)'; }
  const c8=fix('c8'); if(c8) c8.fix='Criadas /curso/precificacao, /curso/formacao-completa e /curso/mudancas';
  const c20=fix('c20'); if(c20){ c20.txt='README com preço errado (R$ 29,90)'; c20.fix='README corrigido: landing R$ 49,90; oferta /quiz1 R$ 29,70'; }
  const add = c => { if(!fix(c.id)) P.correcoes.push(c); };
  add({id:'c21', site:'tamaracavalcante.com.br', pag:'Contato', pri:'Média', txt:'Site sem e-mail de contato válido', fix:'Definir um e-mail que receba (ex.: contato@tamaracavalcante.com.br na Locaweb) e voltar a exibir', arquivo:'index.html, privacidade.html', ok:false});
  add({id:'c22', site:'freimiguellucero.com.br', pag:'Repositório', pri:'Alta', txt:'PDFs pagos continuam no histórico do repositório público', fix:'Tornar o repositório privado ou limpar o histórico', arquivo:'GitHub', ok:false});
  add({id:'c23', site:'casa_em_ordem.vidaemmetodo.com.br', pag:'Área do comprador', pri:'Alta', txt:'PDFs pagos e área exclusiva acessíveis sem login', fix:'Entregar pela área de membros da Kiwify; noindex e robots.txt já aplicados', arquivo:'pdfs/, jornada-exclusiva-ceo2026.html', ok:false});
  add({id:'c24', site:'casa_em_ordem.vidaemmetodo.com.br', pag:'Quiz', pri:'Alta', txt:'Contador "condição especial termina em" vencido (21/07/2026)', fix:'Removido dos dois quizzes', arquivo:'casa-em-ordem-quiz/', ok:true});
  add({id:'c25', site:'casa_em_ordem.vidaemmetodo.com.br', pag:'Home', pri:'Média', txt:'Sem política de privacidade, termos e contato', fix:'Criadas privacidade.html e termos.html; contato no rodapé', arquivo:'index.html', ok:true});
  add({id:'c26', site:'casa_em_ordem.vidaemmetodo.com.br', pag:'Preço', pri:'Média', txt:'Preço de referência "De R$ 97,00"', fix:'Manter só se o kit já foi vendido por R$ 97 (CDC)', arquivo:'index.html, quizzes', ok:false});

  // Frei Miguel
  setP('mp12', {alerta:'PDFs no histórico do repositório público', emailPub:'corujalabs.dev@gmail.com',
    acao:'Tornar o repositório privado; renomear o produto no Kiwify para "Diário do Despertar"', nota:'Landing corrigida em 05/11/2026: sem contador, sem 131k, depoimentos ocultos, personagem identificado, privacidade e termos. Kiwify no CPF do Solano.'},
    {priv:'f', emailDom:'na'});

  // Casa em Ordem é produto da Tâmara (domínio Vida em Método)
  setP('mp14', {nome:'Casa em Ordem (kit)', marca:'tamara', alerta:'Área do comprador sem login', emailPub:'corujalabs.dev@gmail.com',
    acao:'Mover entrega para a área de membros da Kiwify; confirmar se "De R$ 97" é preço real', nota:'Landing R$ 49,90 (JuDImie). Quiz /quiz1 R$ 29,70 (FOqNutF). Domínio vidaemmetodo.com.br.'},
    {priv:'f', landing:'f'});
  const k15=kw('k15'); if(k15) k15.marca='tamara';
  if(!kw('k16')) P.kiwify.push({id:'k16', marca:'tamara', nome:'Casa em Ordem — oferta do diagnóstico /quiz1', preco:29.70, link:'pay.kiwify.com.br/FOqNutF', landing:'casa-em-ordem-quiz.vidaemmetodo.com.br/quiz1/', obs:'6x R$ 4,95'});
  const k10=kw('k10'); if(k10 && !k10.link) k10.link='pay.kiwify.com.br/vfO3ury';
  if(!P.produtos.some(p=>p.marca==='vida') && !P.kiwify.some(k=>k.marca==='vida')) P.marcas = P.marcas.filter(m=>m.id!=='vida');

  // Tâmara
  setP('mp10', {acao:'Definir um e-mail de contato que funcione (o do site não recebia)', nota:'Site corrigido em 05/11/2026: privacidade, termos, CNPJ, textos e método unificado.'}, {priv:'f'});
  setP('mp11', {acao:'Informar preços das formações e da Coleção completa; abrir vendas da Especialista em Mudança'}, {priv:'f'});

  P.seedVersion = 2;
  return true;
}
function pfP(){ return D.portfolio; }
function pfMarca(id){ return pfP().marcas.find(m=>m.id===id) || {id, nome:id||'Sem marca', cor:'#64748B'}; }
function pfProd(id){ return pfP().produtos.find(p=>p.id===id); }
function pfEsc(v){ return typeof safeText==='function' ? safeText(v) : String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pfHref(u){ u=String(u||'').trim(); if(!u||/\s/.test(u)||!u.includes('.')) return ''; return /^https?:/.test(u)?u:'https://'+u; }
function pfId(){ return 'x'+Math.random().toString(36).slice(2,8); }
function pfBRL(v){ return v==null||v===''||isNaN(v) ? '—' : 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }

function pfCkStats(p){
  const vals = PF_CHECK_STEPS.map(([k])=>(p.check||{})[k]||'p');
  const total = vals.filter(v=>v!=='na').length, done = vals.filter(v=>v==='f').length;
  return {done, total, pct: total ? Math.round(done/total*100) : 100};
}
function pfPendencias(p){
  const need = ['email','emailPub','instagram','dominio'];
  if(p.tipo==='Persona de conteúdo') return need.filter(k=>k==='instagram' && !String(p[k]||'').trim()).length;
  return need.filter(k=>{ const v=String(p[k]||'').trim(); return !v || /a criar|verificar|confirmar/i.test(v); }).length;
}
function pfHealth(p){
  const a = String(p.alerta||'');
  if(/pol[ií]tica|bloque|suspens|reprov/i.test(a)) return 'red';
  if(a.trim()) return 'amber';
  if(p.status==='pausado') return 'amber';
  return 'green';
}
const PF_HEALTH_LBL = {red:'Crítico', amber:'Atenção', green:'Em dia'};

/* ---------- edição ---------- */
function pfSet(id, field, val){
  const p = pfProd(id); if(!p) return;
  p[field] = val; save(); renderPortfolio(); pfRenderDrawerHead();
}
function pfCycleCheck(id, key){
  const p = pfProd(id); if(!p) return;
  const order = ['p','f','na']; const cur = p.check[key]||'p';
  p.check[key] = order[(order.indexOf(cur)+1)%order.length];
  save(); renderPortfolio(); pfRenderDrawer();
}
function pfAddProduto(){
  const marca = pfView.marca || 'apps';
  const p = {id:pfId(), nome:'Novo produto', marca, tipo:'App', cnpj:'2', status:'ideia', alerta:'', pacote:'', dominio:'', site:'', repo:'', checkout:'',
    email:'', emailPub:'', instagram:'', whatsapp:'', acao:'', nota:'', check:pfCheck()};
  pfP().produtos.push(p); save(); renderPortfolio(); pfOpen(p.id, 'geral');
  setTimeout(()=>{ const el=document.getElementById('pf-f-nome'); if(el){el.focus(); el.select();} }, 60);
}
function pfDelProduto(id){
  const p = pfProd(id); if(!p) return;
  if(!confirm(`Excluir "${p.nome}" do portfólio?`)) return;
  pfP().produtos = pfP().produtos.filter(x=>x.id!==id); save(); pfClose(); renderPortfolio();
}

/* ---------- filtros ---------- */
function pfSetFilter(k, v){ pfView[k] = pfView[k]===v ? '' : v; pfSaveView(); renderPortfolio(); }
function pfSetMode(m){ pfView.mode = m; pfSaveView(); renderPortfolio(); }
function pfSearch(v){ pfView.q = v; renderPortfolio(true); }
function pfFiltered(){
  const q = pfView.q.trim().toLowerCase();
  return pfP().produtos.filter(p=>{
    if(pfView.marca && p.marca!==pfView.marca) return false;
    if(pfView.saude && pfHealth(p)!==pfView.saude) return false;
    if(pfView.tipo && p.tipo!==pfView.tipo) return false;
    if(q && !JSON.stringify([p.nome,p.instagram,p.dominio,p.email,p.pacote,p.acao]).toLowerCase().includes(q)) return false;
    return true;
  });
}

/* ---------- página Portfólio ---------- */
function renderPortfolio(keepFocus){
  const root = document.getElementById('pf-root'); if(!root || !D.portfolio) return;
  const P = pfP(), all = P.produtos;
  const crit = all.filter(p=>pfHealth(p)==='red'), aten = all.filter(p=>pfHealth(p)==='amber');
  const ck = all.reduce((a,p)=>{const s=pfCkStats(p);a.d+=s.done;a.t+=s.total;return a;},{d:0,t:0});
  const pend = all.reduce((a,p)=>a+pfPendencias(p),0);
  const fixes = P.correcoes.filter(c=>!c.ok), fixesAlta = fixes.filter(c=>c.pri==='Alta');
  const list = pfFiltered();

  const kpis = [
    {l:'Produtos', v:all.length, s:`${all.filter(p=>['producao','ativo'].includes(p.status)).length} no ar`, go:"pfSetFilter('saude','')"},
    {l:'Críticos', v:crit.length, s:'política / bloqueio', tone:crit.length?'red':'', go:"pfSetFilter('saude','red')"},
    {l:'Atenção', v:aten.length, s:'alertas abertos', tone:aten.length?'amber':'', go:"pfSetFilter('saude','amber')"},
    {l:'Domínios', v:Math.round(ck.d/Math.max(1,ck.t)*100)+'%', s:`${ck.d}/${ck.t} etapas feitas`, bar:ck.d/Math.max(1,ck.t)},
    {l:'Contatos', v:pend, s:'campos pendentes', tone:pend?'amber':''},
    {l:'Sites', v:fixes.length, s:`${fixesAlta.length} de prioridade alta`, tone:fixesAlta.length?'red':'', go:"go('sites')"},
  ];

  const prio = [
    ...crit.map(p=>({t:p.nome, d:p.alerta, a:p.acao, tone:'red', on:`pfOpen('${p.id}','geral')`})),
    ...fixesAlta.slice(0,4).map(c=>({t:c.site.replace(/\..*$/,'')+' '+c.pag, d:c.txt, a:c.fix, tone:'amber', on:"go('sites')"})),
  ].slice(0,4);

  const chip = (k,v,l,dot) => `<button class="pf-chip ${pfView[k]===v?'on':''}" onclick="pfSetFilter('${k}','${v}')">${dot?`<i style="background:${dot}"></i>`:''}${pfEsc(l)}</button>`;

  let body = '';
  if(!list.length){
    body = `<div class="pf-empty"><strong>Nada encontrado</strong>Ajuste os filtros ou <a href="#" onclick="pfClearFilters();return false">limpe tudo</a>.</div>`;
  } else if(pfView.mode==='tabela'){
    body = pfTable(list);
  } else {
    const order = P.marcas.map(m=>m.id);
    const groups = {};
    list.forEach(p=>{ (groups[p.marca]=groups[p.marca]||[]).push(p); });
    Object.keys(groups).sort((a,b)=>(order.indexOf(a)+99*(order.indexOf(a)<0))-(order.indexOf(b)+99*(order.indexOf(b)<0))).forEach(mid=>{
      const m = pfMarca(mid), ps = groups[mid];
      const sev = {red:0,amber:1,green:2};
      const live = p => ['producao','ativo'].includes(p.status) ? 0 : 1;
      ps.sort((a,b)=>sev[pfHealth(a)]-sev[pfHealth(b)] || live(a)-live(b) || a.nome.localeCompare(b.nome));
      body += `<section class="pf-group">
        <header class="pf-ghead"><span class="pf-gdot" style="background:${m.cor}"></span><h3>${pfEsc(m.nome)}</h3><span class="pf-gcount">${ps.length}</span><span class="pf-gdesc">${pfEsc(m.desc||'')}</span></header>
        <div class="pf-grid">${ps.map(pfCard).join('')}</div></section>`;
    });
  }

  root.innerHTML = `
    <div class="ph pf-ph">
      <div><div class="pt">Portfólio</div><div class="ps">${pfEsc(P.holding.nome)} · ${all.length} produtos em ${P.marcas.length} marcas</div></div>
      <div class="pa"><button class="btn btn-p" onclick="pfAddProduto()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Produto</button></div>
    </div>
    <div class="pf-kpis">${kpis.map(k=>`<div class="pf-kpi ${k.tone?'t-'+k.tone:''} ${k.go?'click':''}" ${k.go?`onclick="${k.go}"`:''}>
      <div class="pf-kpi-l">${k.l}</div><div class="pf-kpi-v">${k.v}</div><div class="pf-kpi-s">${k.s}</div>
      ${k.bar!=null?`<div class="pf-bar"><span style="width:${Math.round(k.bar*100)}%"></span></div>`:''}</div>`).join('')}</div>
    ${prio.length?`<div class="pf-prio"><div class="pf-prio-h">Resolver primeiro</div>${prio.map(x=>`<button class="pf-prio-i t-${x.tone}" onclick="${x.on}"><b>${pfEsc(x.t)}</b><span>${pfEsc(x.d)}</span>${x.a?`<em>→ ${pfEsc(x.a)}</em>`:''}</button>`).join('')}</div>`:''}
    <div class="pf-toolbar">
      <div class="pf-search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>
        <input id="pf-q" placeholder="Buscar produto, @, domínio, pacote…" value="${pfEsc(pfView.q)}" oninput="pfSearch(this.value)"></div>
      <div class="pf-chips">${P.marcas.map(m=>chip('marca',m.id,m.nome,m.cor)).join('')}</div>
      <div class="pf-chips">${chip('saude','red','Crítico','#DC2626')}${chip('saude','amber','Atenção','#D97706')}${chip('saude','green','Em dia','#16A34A')}</div>
      <div class="pf-seg"><button class="${pfView.mode==='cards'?'on':''}" onclick="pfSetMode('cards')">Cards</button><button class="${pfView.mode==='tabela'?'on':''}" onclick="pfSetMode('tabela')">Tabela</button></div>
    </div>
    ${body}`;
  if(keepFocus===true){ const q=document.getElementById('pf-q'); if(q){ q.focus(); q.setSelectionRange(q.value.length,q.value.length); } }
  const nb = document.getElementById('nb-pf'); if(nb){ nb.textContent = crit.length || all.length; nb.classList.toggle('nb-red', !!crit.length); }
}
function pfClearFilters(){ pfView.marca=''; pfView.saude=''; pfView.tipo=''; pfView.q=''; pfSaveView(); renderPortfolio(); }

function pfStatusPill(p){ const s=PF_STATUS[p.status]||PF_STATUS.ideia; return `<span class="pf-st s-${s.c}">${s.l}</span>`; }
function pfContactDots(p){
  const items = [['email','✉','E-mail'],['instagram','@','Instagram'],['dominio','◎','Domínio'],['site','↗','Site'],['repo','{}','Repo']];
  return items.map(([k,ic,l])=>{ const v=String(p[k]||'').trim(); const ok=v && !/a criar|verificar|confirmar/i.test(v);
    return `<span class="pf-cd ${ok?'ok':''}" title="${l}: ${pfEsc(v||'pendente')}">${ic}</span>`; }).join('');
}
function pfCard(p){
  const h = pfHealth(p), ck = pfCkStats(p), m = pfMarca(p.marca);
  return `<article class="pf-card h-${h}" onclick="pfOpen('${p.id}')" tabindex="0" onkeydown="if(event.key==='Enter')pfOpen('${p.id}')">
    <div class="pf-card-h">
      <span class="pf-health" title="${PF_HEALTH_LBL[h]}"></span>
      <div class="pf-card-t"><div class="pf-name">${pfEsc(p.nome)}</div><div class="pf-sub">${pfEsc(p.tipo)}${p.pacote?` · <span class="mono">${pfEsc(p.pacote)}</span>`:''}</div></div>
      ${pfStatusPill(p)}
    </div>
    ${p.alerta?`<div class="pf-alert a-${h}">${pfEsc(p.alerta)}</div>`:''}
    ${p.metrica?`<div class="pf-metric">${pfEsc(p.metrica)}</div>`:''}
    <div class="pf-ck"><div class="pf-ck-top"><span>Domínio & marketing</span><b>${ck.done}/${ck.total}</b></div><div class="pf-bar"><span style="width:${ck.pct}%;background:${m.cor}"></span></div></div>
    ${p.acao?`<div class="pf-next"><span>Próxima ação</span>${pfEsc(p.acao)}</div>`:''}
    <div class="pf-card-f"><div class="pf-cds">${pfContactDots(p)}</div><span class="pf-cnpj">CNPJ ${pfEsc(p.cnpj||'—')}</span></div>
  </article>`;
}
function pfTable(list){
  return `<div class="pf-table-wrap"><table class="pf-table"><thead><tr>
    <th></th><th>Produto</th><th>Marca</th><th>Status</th><th>Alerta</th><th>Domínio</th><th>E-mail</th><th>Instagram</th><th>Próxima ação</th></tr></thead><tbody>
    ${list.map(p=>{ const ck=pfCkStats(p), m=pfMarca(p.marca), h=pfHealth(p);
      return `<tr onclick="pfOpen('${p.id}')"><td><span class="pf-health h-${h}"></span></td>
      <td><b>${pfEsc(p.nome)}</b><div class="pf-sub">${pfEsc(p.tipo)}</div></td>
      <td><span class="pf-mk"><i style="background:${m.cor}"></i>${pfEsc(m.nome)}</span></td>
      <td>${pfStatusPill(p)}</td><td class="pf-td-alert">${pfEsc(p.alerta||'—')}</td>
      <td><div class="pf-mini"><div class="pf-bar"><span style="width:${ck.pct}%;background:${m.cor}"></span></div><small>${ck.done}/${ck.total}</small></div></td>
      <td class="mono">${pfEsc(p.email||'—')}</td><td>${pfEsc(p.instagram||'—')}</td><td class="pf-td-act">${pfEsc(p.acao||'—')}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}

/* ---------- painel lateral ---------- */
function pfOpen(id, tab){
  pfOpenId = id; if(tab) pfTab = tab;
  if(document.getElementById('page-portfolio') && !document.getElementById('page-portfolio').classList.contains('active')) go('portfolio');
  document.getElementById('pf-drawer').classList.add('open');
  document.getElementById('pf-scrim').classList.add('open');
  pfRenderDrawer();
}
function pfClose(){ pfOpenId=null; document.getElementById('pf-drawer')?.classList.remove('open'); document.getElementById('pf-scrim')?.classList.remove('open'); }
function pfSetTab(t){ pfTab=t; pfRenderDrawer(); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && pfOpenId) pfClose(); });

function pfRenderDrawerHead(){
  const p = pfProd(pfOpenId), el = document.getElementById('pf-dr-head'); if(!p||!el) return;
  const h = pfHealth(p), m = pfMarca(p.marca);
  el.innerHTML = `<div class="pf-dr-mk" style="background:${m.cor}">${pfEsc(m.nome)}</div>
    <div class="pf-dr-title">${pfEsc(p.nome)}</div>
    <div class="pf-dr-meta">${pfStatusPill(p)}<span class="pf-hbadge h-${h}"><i></i>${PF_HEALTH_LBL[h]}</span><span class="pf-cnpj">CNPJ ${pfEsc(p.cnpj||'—')}</span></div>`;
}
function pfField(p, k, label, opts){
  opts = opts||{};
  const id = 'pf-f-'+k, v = p[k]??'';
  let input;
  if(opts.select) input = `<select class="finput" id="${id}" onchange="pfSet('${p.id}','${k}',this.value)">${opts.select.map(([ov,ol])=>`<option value="${pfEsc(ov)}" ${ov===v?'selected':''}>${pfEsc(ol)}</option>`).join('')}</select>`;
  else if(opts.area) input = `<textarea class="finput pf-ta" id="${id}" rows="3" onchange="pfSet('${p.id}','${k}',this.value)" placeholder="${pfEsc(opts.ph||'')}">${pfEsc(v)}</textarea>`;
  else input = `<input class="finput" id="${id}" value="${pfEsc(v)}" placeholder="${pfEsc(opts.ph||'')}" onchange="pfSet('${p.id}','${k}',this.value)">`;
  const href = opts.link ? (k==='instagram' && v ? 'https://instagram.com/'+String(v).replace(/^@/,'') : k==='email'||k==='emailPub' ? (/@/.test(v)&&!/\s/.test(String(v).trim())?'mailto:'+String(v).trim():'') : pfHref(v)) : '';
  const copy = opts.link && v ? `<button class="pf-ib" title="Copiar" onclick="navigator.clipboard.writeText(document.getElementById('${id}').value);this.classList.add('done');setTimeout(()=>this.classList.remove('done'),900)">⧉</button>` : '';
  return `<div class="pf-fld ${opts.span?'span':''}"><label for="${id}">${label}${opts.hint?`<small>${pfEsc(opts.hint)}</small>`:''}</label>
    <div class="pf-fld-in">${input}${href?`<a class="pf-ib" href="${pfEsc(href)}" target="_blank" rel="noopener" title="Abrir">↗</a>`:''}${copy}</div></div>`;
}
function pfRenderDrawer(){
  const p = pfProd(pfOpenId), box = document.getElementById('pf-dr-body'); if(!p||!box) return;
  pfRenderDrawerHead();
  document.querySelectorAll('.pf-tab').forEach(b=>b.classList.toggle('on', b.dataset.tab===pfTab));
  const P = pfP();
  let html = '';
  if(pfTab==='geral'){
    html = `<div class="pf-form">
      ${pfField(p,'nome','Nome',{span:true})}
      ${pfField(p,'marca','Marca',{select:P.marcas.map(m=>[m.id,m.nome])})}
      ${pfField(p,'tipo','Tipo',{select:PF_TIPOS.map(t=>[t,t])})}
      ${pfField(p,'status','Status',{select:Object.entries(PF_STATUS).map(([k,s])=>[k,s.l])})}
      ${pfField(p,'cnpj','CNPJ de destino',{select:[['1','1 — Serviços'],['2','2 — Produtos digitais'],['','A definir']]})}
      ${pfField(p,'alerta','Alerta',{span:true,ph:'Ex.: 1 problema com a política do Play',hint:'Use "política" para marcar como crítico'})}
      ${pfField(p,'metrica','Métrica',{span:true,ph:'Ex.: 51 aquisições (+38%)'})}
      ${pfField(p,'acao','Próxima ação',{span:true,area:true})}
      ${pfField(p,'nota','Notas',{span:true,area:true})}
    </div>
    <div class="pf-dr-actions">
      ${p.projId && (D.projects||[]).some(x=>x.id===p.projId)?`<button class="btn btn-g btn-sm" onclick="pfClose();openProj('${p.projId}')">Abrir projeto e tarefas</button>`:''}
      <button class="btn btn-g btn-sm pf-danger" onclick="pfDelProduto('${p.id}')">Excluir</button>
    </div>`;
  } else if(pfTab==='contatos'){
    const n = pfPendencias(p);
    html = `<div class="pf-note">${n?`<b>${n} campo(s) essenciais pendentes.</b> `:''}Senhas não ficam aqui — use um gerenciador e informe só onde estão.</div>
      <div class="pf-form">${PF_CONTACT_FIELDS.map(([k,l,ph])=>pfField(p,k,l,{ph,link:true,span:['site','repo','checkout'].includes(k)})).join('')}</div>`;
  } else if(pfTab==='dominio'){
    const s = pfCkStats(p);
    html = `<div class="pf-ck-head"><div><b>${s.done} de ${s.total}</b> etapas · ${s.pct}%</div><div class="pf-bar big"><span style="width:${s.pct}%;background:${pfMarca(p.marca).cor}"></span></div><small>Toque para alternar: Pendente → Feito → N/A</small></div>
      <ol class="pf-steps">${PF_CHECK_STEPS.map(([k,l],i)=>{ const v=p.check[k]||'p';
        return `<li class="ck-${v}" onclick="pfCycleCheck('${p.id}','${k}')"><span class="pf-step-n">${v==='f'?'✓':v==='na'?'–':i+1}</span><span class="pf-step-l">${l}</span><span class="pf-step-s">${PF_CK_LBL[v]}</span></li>`; }).join('')}</ol>`;
  } else if(pfTab==='vendas'){
    const ks = P.kiwify.filter(k=>k.marca===p.marca);
    html = ks.length ? `<div class="pf-note">Produtos no Kiwify da marca <b>${pfEsc(pfMarca(p.marca).nome)}</b>. Edite em <a href="#" onclick="pfClose();go('infoprodutos');return false">Infoprodutos</a>.</div>
      <div class="pf-klist">${ks.map(k=>`<div class="pf-ki"><div><b>${pfEsc(k.nome)}</b>${k.obs?`<small>${pfEsc(k.obs)}</small>`:''}</div><span>${pfBRL(k.preco)}</span></div>`).join('')}</div>`
      : `<div class="pf-empty sm">Sem produtos no Kiwify para esta marca.</div>`;
  }
  box.innerHTML = html;
}

/* ---------- Infoprodutos ---------- */
let pfKMarca = '';
function pfKSet(id, field, val){
  const k = pfP().kiwify.find(x=>x.id===id); if(!k) return;
  if(field==='preco'){ const n=parseFloat(String(val).replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3})/g,'').replace(',','.')); k.preco = isNaN(n)?null:n; }
  else k[field]=val;
  save(); renderInfoprodutos();
}
function pfKAdd(){ pfP().kiwify.push({id:pfId(), marca:pfKMarca||'tamara', nome:'Novo produto', preco:null, link:'', landing:'', obs:''}); save(); renderInfoprodutos(); }
function pfKDel(id){ if(!confirm('Excluir este produto?')) return; pfP().kiwify = pfP().kiwify.filter(x=>x.id!==id); save(); renderInfoprodutos(); }
function pfKFilter(m){ pfKMarca = pfKMarca===m?'':m; renderInfoprodutos(); }
function renderInfoprodutos(){
  const root = document.getElementById('ip-root'); if(!root||!D.portfolio) return;
  const P = pfP(), list = P.kiwify.filter(k=>!pfKMarca||k.marca===pfKMarca);
  const marcas = P.marcas.filter(m=>P.kiwify.some(k=>k.marca===m.id));
  const tot = marcas.map(m=>{ const ks=P.kiwify.filter(k=>k.marca===m.id), pr=ks.filter(k=>k.preco!=null);
    return {m, n:ks.length, semPreco:ks.length-pr.length, semLink:ks.filter(k=>!k.link).length, tk: pr.length? pr.reduce((a,k)=>a+k.preco,0)/pr.length : 0}; });
  root.innerHTML = `
    <div class="ph"><div><div class="pt">Infoprodutos</div><div class="ps">Kiwify · ${P.kiwify.length} produtos · hoje no CPF — migrar para o CNPJ 2</div></div>
      <div class="pa"><button class="btn btn-p" onclick="pfKAdd()">+ Produto</button></div></div>
    <div class="pf-kpis">${tot.map(t=>`<div class="pf-kpi click ${pfKMarca===t.m.id?'sel':''}" onclick="pfKFilter('${t.m.id}')" style="--mk:${t.m.cor}">
      <div class="pf-kpi-l"><i class="pf-dot" style="background:${t.m.cor}"></i>${pfEsc(t.m.nome)}</div><div class="pf-kpi-v">${t.n}</div>
      <div class="pf-kpi-s">ticket médio ${pfBRL(t.tk)}${t.semPreco?` · ${t.semPreco} sem preço`:''}</div></div>`).join('')}</div>
    <div class="pf-table-wrap"><table class="pf-table pf-edit"><thead><tr><th>Marca</th><th>Produto</th><th class="r">Preço</th><th>Checkout</th><th>Landing</th><th>Observação</th><th></th></tr></thead><tbody>
    ${list.map(k=>{ const m=pfMarca(k.marca); return `<tr>
      <td><select class="pf-cell" onchange="pfKSet('${k.id}','marca',this.value)">${P.marcas.map(x=>`<option value="${x.id}" ${x.id===k.marca?'selected':''}>${pfEsc(x.nome)}</option>`).join('')}</select></td>
      <td><input class="pf-cell b" value="${pfEsc(k.nome)}" onchange="pfKSet('${k.id}','nome',this.value)"></td>
      <td class="r"><input class="pf-cell r ${k.preco==null?'warn':''}" value="${k.preco==null?'':Number(k.preco).toFixed(2).replace('.',',')}" placeholder="sem preço" onchange="pfKSet('${k.id}','preco',this.value)"></td>
      <td><div class="pf-cell-l"><input class="pf-cell mono ${!k.link?'warn':''}" value="${pfEsc(k.link)}" placeholder="sem link" onchange="pfKSet('${k.id}','link',this.value)">${pfHref(k.link)?`<a href="${pfHref(k.link)}" target="_blank" rel="noopener">↗</a>`:''}</div></td>
      <td><div class="pf-cell-l"><input class="pf-cell mono" value="${pfEsc(k.landing)}" onchange="pfKSet('${k.id}','landing',this.value)">${pfHref(k.landing)?`<a href="${pfHref(k.landing)}" target="_blank" rel="noopener">↗</a>`:''}</div></td>
      <td><input class="pf-cell" value="${pfEsc(k.obs)}" onchange="pfKSet('${k.id}','obs',this.value)"></td>
      <td><button class="pf-ib del" title="Excluir" onclick="pfKDel('${k.id}')">×</button></td></tr>`; }).join('')}
    </tbody></table></div>`;
}

/* ---------- Sites ---------- */
let pfSiteFilter = 'abertos';
function pfFixToggle(id){ const c=pfP().correcoes.find(x=>x.id===id); if(!c) return; c.ok=!c.ok; save(); renderSites(); renderPortfolio(); }
function pfSiteSet(f){ pfSiteFilter=f; renderSites(); }
function renderSites(){
  const root = document.getElementById('st-root'); if(!root||!D.portfolio) return;
  const P = pfP(), sites = [...new Set(P.correcoes.map(c=>c.site))];
  const pr = {Alta:0,'Média':1,Baixa:2};
  const repoOf = s => (P.produtos.find(p=>p.site&&p.site.startsWith(s.split('/')[0]) || p.dominio===s)||{}).repo || '';
  root.innerHTML = `
    <div class="ph"><div><div class="pt">Sites</div><div class="ps">Correções por site — marque conforme publicar</div></div>
      <div class="pf-seg"><button class="${pfSiteFilter==='abertos'?'on':''}" onclick="pfSiteSet('abertos')">Abertas</button><button class="${pfSiteFilter==='todos'?'on':''}" onclick="pfSiteSet('todos')">Todas</button></div></div>
    ${sites.map(s=>{ const cs=P.correcoes.filter(c=>c.site===s), done=cs.filter(c=>c.ok).length, show=cs.filter(c=>pfSiteFilter==='todos'||!c.ok).sort((a,b)=>pr[a.pri]-pr[b.pri]);
      const repo = repoOf(s);
      return `<section class="pf-site">
        <header><div><h3><a href="${pfHref(s)}" target="_blank" rel="noopener">${pfEsc(s)} ↗</a></h3>${repo?`<a class="pf-repo mono" href="${pfHref(repo)}" target="_blank" rel="noopener">${pfEsc(repo)}</a>`:''}</div>
          <div class="pf-site-p"><b>${done}/${cs.length}</b><div class="pf-bar"><span style="width:${Math.round(done/cs.length*100)}%"></span></div></div></header>
        ${show.length?`<ul class="pf-fixes">${show.map(c=>`<li class="${c.ok?'ok':''}">
          <button class="pf-cb ${c.ok?'on':''}" onclick="pfFixToggle('${c.id}')" aria-label="Marcar como feito">${c.ok?'✓':''}</button>
          <div class="pf-fix-b"><div class="pf-fix-t"><span class="pf-pri p-${c.pri==='Alta'?'a':c.pri==='Média'?'m':'b'}">${c.pri}</span><span class="pf-pag">${pfEsc(c.pag)}</span>${pfEsc(c.txt)}</div>
          <div class="pf-fix-f">→ ${pfEsc(c.fix)}${c.arquivo?` <code>${pfEsc(c.arquivo)}</code>`:''}</div></div></li>`).join('')}</ul>`:`<div class="pf-empty sm">Tudo resolvido neste site.</div>`}
      </section>`; }).join('')}`;
}

/* ---------- Empresas ---------- */
function pfHoldSet(f,v){ pfP().holding[f]=v; save(); renderEmpresas(); pfBrandSidebar(); renderPortfolio(); }
function pfEtapaToggle(id){ const e=pfP().etapas.find(x=>x.id===id); if(!e) return; e.ok=!e.ok; save(); renderEmpresas(); }
function pfEmpSet(id,f,v){ const e=pfP().empresas.find(x=>x.id===id); if(!e) return; e[f]=v; save(); }
function renderEmpresas(){
  const root = document.getElementById('em-root'); if(!root||!D.portfolio) return;
  const P = pfP(), H = P.holding, done = P.etapas.filter(e=>e.ok).length;
  const byCnpj = c => P.produtos.filter(p=>String(p.cnpj)===c);
  const fases = [...new Set(P.etapas.map(e=>e.quando))];
  root.innerHTML = `
    <div class="ph"><div><div class="pt">Empresas</div><div class="ps">Estrutura societária e migração das plataformas</div></div></div>
    <div class="pf-hold">
      <div class="pf-fld"><label>Nome em uso</label><input class="finput" value="${pfEsc(H.nome)}" onchange="pfHoldSet('nome',this.value)"></div>
      <div class="pf-fld"><label>Nome futuro</label><input class="finput" value="${pfEsc(H.nomeFuturo||'')}" onchange="pfHoldSet('nomeFuturo',this.value)"></div>
      <div class="pf-fld span"><label>Notas</label><textarea class="finput pf-ta" rows="2" onchange="pfHoldSet('nota',this.value)">${pfEsc(H.nota||'')}</textarea></div>
    </div>
    <div class="pf-cnpjs">${P.empresas.map((e,i)=>{ const ps=byCnpj(String(i+1)); return `<div class="pf-cnpj-card">
      <div class="pf-cnpj-h"><span class="pf-cnpj-n">${i+1}</span><div><input class="pf-cell b" value="${pfEsc(e.nome)}" onchange="pfEmpSet('${e.id}','nome',this.value)"><span class="pf-st s-a">${pfEsc(e.status)}</span></div></div>
      <dl><dt>Base</dt><dd><input class="pf-cell" value="${pfEsc(e.base)}" onchange="pfEmpSet('${e.id}','base',this.value)"></dd>
      <dt>Titular</dt><dd><input class="pf-cell" value="${pfEsc(e.titular)}" onchange="pfEmpSet('${e.id}','titular',this.value)"></dd>
      <dt>Razão social</dt><dd><input class="pf-cell" value="${pfEsc(e.razao)}" onchange="pfEmpSet('${e.id}','razao',this.value)"></dd>
      <dt>Receitas</dt><dd><textarea class="pf-cell" rows="2" onchange="pfEmpSet('${e.id}','receitas',this.value)">${pfEsc(e.receitas)}</textarea></dd></dl>
      <div class="pf-cnpj-ps"><small>${ps.length} produto(s) destinados</small>${ps.map(p=>`<button class="pf-tag" onclick="pfOpen('${p.id}','geral')"><i style="background:${pfMarca(p.marca).cor}"></i>${pfEsc(p.nome)}</button>`).join('')}</div>
    </div>`; }).join('')}</div>
    <div class="pf-tl-h"><h3>Plano de migração</h3><span><b>${done}/${P.etapas.length}</b> concluídas</span></div>
    <div class="pf-tl">${fases.map(f=>`<div class="pf-tl-col"><div class="pf-tl-q">${pfEsc(f)}</div>${P.etapas.filter(e=>e.quando===f).map(e=>`
      <button class="pf-tl-i ${e.ok?'ok':''}" onclick="pfEtapaToggle('${e.id}')"><span class="pf-cb ${e.ok?'on':''}">${e.ok?'✓':''}</span>${pfEsc(e.txt)}</button>`).join('')}</div>`).join('')}</div>
    <div class="pf-note">Confirme com contador e corregedoria antes de executar. Até a migração, continue vendendo como está.</div>`;
}

/* ---------- integração ---------- */
function pfBrandSidebar(){
  const n = document.querySelector('.brand-name'); if(n && D.portfolio) n.textContent = D.portfolio.holding.nome;
}
function renderPortfolioAll(){
  if(pfEnsure() && typeof save==='function') save();
  renderPortfolio(); renderInfoprodutos(); renderSites(); renderEmpresas(); pfBrandSidebar();
  if(pfOpenId) pfRenderDrawer();
}
