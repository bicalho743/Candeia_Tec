/* Planos de marketing — repositório de arquivos por produto.
   Metadados: Firestore planos/{uid}  →  {itens:[...]}
   Conteúdo:  Firestore planos/{uid}/partes/{itemId}_{n}  →  {d: base64}  (partes de ~900 KB, sem Firebase Storage)
   Depende de: db, currentUID, D.portfolio, pfP(), pfMarca(), pfProd(), pfEsc(), pfHref(), pfId(), go() */

const MK_MAX_MB = 20;
const MK_CHUNK = 900000; // caracteres base64 por documento (limite do Firestore: 1 MiB)
const MK_STATUS = {
  vigente:   {l:'Vigente',   c:'g'},
  rascunho:  {l:'Rascunho',  c:'b'},
  arquivado: {l:'Arquivado', c:'n'},
};
const MK_GERAL = '_geral'; // plano da Candeia Tec / de uma marca inteira

let MK = {itens:[]}, mkLoaded = false, mkLoading = null, mkErr = '';
let mkView = {marca:'', q:'', arquivados:false};
let mkForm = null;          // item em edição (ou novo)
let mkFile = null;          // File escolhido no formulário
const mkBlobCache = {};     // id → objectURL

/* ---------- Firestore ---------- */
function mkRef(){ return db.collection('planos').doc(currentUID); }
function mkPartRef(id, n){ return mkRef().collection('partes').doc(id+'_'+n); }

function mkLoad(){
  if(mkLoaded || !currentUID) return Promise.resolve();
  if(mkLoading) return mkLoading;
  mkLoading = mkRef().get().then(doc=>{
    MK = doc.exists && Array.isArray(doc.data().itens) ? {itens:doc.data().itens} : {itens:[]};
    mkLoaded = true; mkErr = '';
  }).catch(e=>{ mkErr = e.code||String(e); console.warn('planos load', e); })
    .finally(()=>{ mkLoading = null; renderMarketing(); mkBadge(); if(typeof pfOpenId!=='undefined' && pfOpenId && pfTab==='marketing') pfRenderDrawer(); });
  return mkLoading;
}
async function mkSaveMeta(){
  await mkRef().set({itens:MK.itens, updatedAt:new Date().toISOString()});
}

function mkB64(file){
  return new Promise((res,rej)=>{ const r=new FileReader();
    r.onload=()=>res(String(r.result).split(',')[1]||''); r.onerror=()=>rej(r.error); r.readAsDataURL(file); });
}
async function mkUploadParts(id, file, onProg){
  const b64 = await mkB64(file), n = Math.max(1, Math.ceil(b64.length/MK_CHUNK));
  for(let i=0;i<n;i++){
    await mkPartRef(id,i).set({d:b64.slice(i*MK_CHUNK,(i+1)*MK_CHUNK)});
    onProg && onProg(i+1,n);
  }
  return n;
}
async function mkDeleteParts(id, n){
  for(let i=0;i<(n||0);i++){ try{ await mkPartRef(id,i).delete(); }catch(e){ console.warn(e); } }
}
async function mkGetBlob(it){
  if(mkBlobCache[it.id]) return mkBlobCache[it.id];
  const parts = await Promise.all(Array.from({length:it.partes||0},(_,i)=>mkPartRef(it.fid||it.id,i).get()));
  const b64 = parts.map(p=>p.exists?p.data().d:'').join('');
  const bin = atob(b64), u8 = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
  return mkBlobCache[it.id] = URL.createObjectURL(new Blob([u8],{type:it.mime||'application/octet-stream'}));
}

/* ---------- helpers ---------- */
function mkProdNome(id){
  if(id===MK_GERAL) return 'Geral — Candeia Tec';
  if(id && id.startsWith('m:')) return 'Marca — '+pfMarca(id.slice(2)).nome;
  const p = pfProd(id); return p ? p.nome : 'Produto removido';
}
function mkProdCor(id){
  if(id===MK_GERAL) return '#64748B';
  if(id && id.startsWith('m:')) return pfMarca(id.slice(2)).cor;
  const p = pfProd(id); return p ? pfMarca(p.marca).cor : '#64748B';
}
function mkTam(b){ if(!b) return ''; return b<1024*1024 ? Math.max(1,Math.round(b/1024))+' KB' : (b/1024/1024).toFixed(1).replace('.',',')+' MB'; }
function mkData(iso){ if(!iso) return ''; const d=new Date(iso); return isNaN(d)?'':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}); }
function mkExt(it){
  if(it.tipo==='link'){ const u=it.url||''; return /docs\.google|drive\.google/.test(u)?'DRIVE':/canva\./.test(u)?'CANVA':/notion\./.test(u)?'NOTION':/claude\.ai/.test(u)?'CLAUDE':'LINK'; }
  const m=(it.nome||'').match(/\.([a-z0-9]{1,5})$/i); return m?m[1].toUpperCase():'ARQ';
}
function mkItensDe(prodId){ return MK.itens.filter(i=>i.prod===prodId && (mkView.arquivados || i.status!=='arquivado'))
  .sort((a,b)=>(a.status==='vigente'?0:1)-(b.status==='vigente'?0:1) || String(b.atualizado||'').localeCompare(String(a.atualizado||''))); }
function mkTemVigente(prodId){ return MK.itens.some(i=>i.prod===prodId && i.status==='vigente'); }
function mkBadge(){
  const nb = document.getElementById('nb-mk'); if(!nb || !D.portfolio) return;
  const prods = pfP().produtos, sem = prods.filter(p=>!mkTemVigente(p.id)).length;
  nb.textContent = mkLoaded ? MK.itens.filter(i=>i.status!=='arquivado').length : '·';
  nb.title = sem ? sem+' produto(s) sem plano vigente' : 'Todos os produtos com plano vigente';
}
function mkProdOptions(sel){
  const P = pfP();
  const opt = (v,l)=>`<option value="${pfEsc(v)}" ${v===sel?'selected':''}>${pfEsc(l)}</option>`;
  return opt(MK_GERAL,'Geral — Candeia Tec') +
    P.marcas.map(m=>`<optgroup label="${pfEsc(m.nome)}">${opt('m:'+m.id,'Marca inteira — '+m.nome)}${P.produtos.filter(p=>p.marca===m.id).map(p=>opt(p.id,p.nome)).join('')}</optgroup>`).join('');
}

/* ---------- ações ---------- */
function mkNovo(prodId, file){
  mkForm = {id:'', prod:prodId||MK_GERAL, titulo:'', status:'vigente', periodo:'', versao:'1', obs:'', tipo:'arquivo', url:''};
  mkFile = null;
  if(file) mkPickFile(file);
  if(!document.getElementById('page-marketing').classList.contains('active')) go('marketing');
  renderMarketing();
  setTimeout(()=>document.getElementById('mk-f-titulo')?.focus(), 30);
}
function mkEditar(id){
  const it = MK.itens.find(i=>i.id===id); if(!it) return;
  mkForm = Object.assign({}, it); mkFile = null;
  if(typeof pfClose==='function') pfClose();
  if(!document.getElementById('page-marketing').classList.contains('active')) go('marketing');
  renderMarketing();
  document.getElementById('mk-form')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function mkNovaVersao(id){
  const it = MK.itens.find(i=>i.id===id); if(!it) return;
  mkNovo(it.prod);
  Object.assign(mkForm, {titulo:it.titulo, periodo:it.periodo, obs:'', versao:String((parseInt(it.versao,10)||1)+1), substitui:it.id});
  renderMarketing();
}
function mkCancelar(){ mkForm = null; mkFile = null; renderMarketing(); }
function mkPickFile(f){
  if(!f) return;
  if(f.size > MK_MAX_MB*1024*1024){ alert(`Arquivo com ${mkTam(f.size)}. O limite é ${MK_MAX_MB} MB — comprima o PDF ou use um link do Drive.`); return; }
  mkFile = f;
  if(mkForm){ mkForm.tipo='arquivo'; if(!mkForm.titulo) mkForm.titulo = f.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').trim(); }
  renderMarketing();
}
function mkF(k, v){ if(mkForm) mkForm[k]=v; if(k==='tipo') renderMarketing(); }

async function mkSalvar(){
  const f = mkForm; if(!f) return;
  f.titulo = (f.titulo||'').trim();
  if(!f.titulo){ alert('Dê um título ao plano.'); return; }
  const novo = !f.id;
  if(f.tipo==='link'){ f.url = (f.url||'').trim(); if(!pfHref(f.url)){ alert('Informe um link válido.'); return; } }
  else if(novo && !mkFile){ alert('Escolha o arquivo do plano.'); return; }

  const btn = document.getElementById('mk-save'), st = document.getElementById('mk-prog');
  const busy = t=>{ if(st) st.textContent=t; if(btn) btn.disabled=true; };
  const now = new Date().toISOString();
  try{
    const it = novo ? {id:pfId()+Date.now().toString(36), criado:now} : MK.itens.find(i=>i.id===f.id);
    const antigo = novo ? null : {fid:it.fid||it.id, partes:it.partes, tipo:it.tipo};
    Object.assign(it, {prod:f.prod, titulo:f.titulo, status:f.status, periodo:f.periodo||'', versao:f.versao||'', obs:f.obs||'', tipo:f.tipo, atualizado:now});
    if(f.tipo==='link'){ it.url=f.url; delete it.nome; delete it.mime; delete it.tam; }
    if(f.tipo==='arquivo' && mkFile){
      const fid = it.id+'v'+Date.now().toString(36);
      busy('Enviando…');
      it.partes = await mkUploadParts(fid, mkFile, (i,n)=>busy(`Enviando… ${Math.round(i/n*100)}%`));
      Object.assign(it, {fid, nome:mkFile.name, mime:mkFile.type||'application/octet-stream', tam:mkFile.size});
      delete it.url; delete mkBlobCache[it.id];
    }
    // vigente único por produto (pergunta antes)
    if(it.status==='vigente'){
      const outros = MK.itens.filter(i=>i.id!==it.id && i.prod===it.prod && i.status==='vigente');
      if(outros.length && (f.substitui ? true : confirm(`Já existe ${outros.length} plano vigente para ${mkProdNome(it.prod)}. Marcar como arquivado?`)))
        outros.forEach(o=>{ o.status='arquivado'; o.atualizado=now; });
    }
    if(novo) MK.itens.push(it);
    busy('Salvando…');
    await mkSaveMeta();
    // limpa o conteúdo antigo quando o arquivo foi trocado
    if(antigo && antigo.tipo==='arquivo' && (it.fid!==antigo.fid || it.tipo==='link')) mkDeleteParts(antigo.fid, antigo.partes);
    mkForm = null; mkFile = null; mkErr = '';
    renderMarketing(); mkBadge();
  }catch(e){
    console.error('planos save', e);
    mkErr = e.code||String(e);
    if(btn) btn.disabled=false;
    if(st) st.textContent='';
    if(novo) MK.itens = MK.itens.filter(i=>i.criado!==now);
    renderMarketing();
  }
}
async function mkExcluir(id){
  const it = MK.itens.find(i=>i.id===id); if(!it) return;
  if(!confirm(`Excluir "${it.titulo}"? O arquivo será apagado do hub e não pode ser recuperado.`)) return;
  MK.itens = MK.itens.filter(i=>i.id!==id);
  try{ await mkSaveMeta(); if(it.tipo==='arquivo') mkDeleteParts(it.fid||it.id, it.partes); }
  catch(e){ mkErr=e.code||String(e); MK.itens.push(it); }
  renderMarketing(); mkBadge(); if(pfOpenId && pfTab==='marketing') pfRenderDrawer();
}
async function mkStatus(id, s){
  const it = MK.itens.find(i=>i.id===id); if(!it) return;
  it.status = s; it.atualizado = new Date().toISOString();
  try{ await mkSaveMeta(); }catch(e){ mkErr=e.code||String(e); }
  renderMarketing(); mkBadge();
}
async function mkAbrir(id, baixar){
  const it = MK.itens.find(i=>i.id===id); if(!it) return;
  if(it.tipo==='link'){ window.open(pfHref(it.url),'_blank','noopener'); return; }
  const inline = !baixar && /^(application\/pdf|image\/|text\/)/.test(it.mime||'');
  const w = inline ? window.open('about:blank','_blank') : null;
  if(w) w.document.write('<p style="font:14px system-ui;padding:24px">Carregando '+pfEsc(it.nome)+'…</p>');
  try{
    const url = await mkGetBlob(it);
    if(w){ w.location.href = url; return; }
    const a = document.createElement('a'); a.href=url; a.download=it.nome||'plano'; document.body.appendChild(a); a.click(); a.remove();
  }catch(e){ if(w) w.close(); alert('Não consegui abrir o arquivo: '+(e.code||e.message||e)); }
}

/* ---------- arrastar e soltar ---------- */
function mkDrop(ev, prodId){
  ev.preventDefault(); ev.currentTarget.classList.remove('over');
  const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]; if(!f) return;
  if(mkForm && !prodId){ mkPickFile(f); return; }
  mkNovo(prodId || (mkForm&&mkForm.prod) || MK_GERAL, f);
}
function mkOver(ev){ ev.preventDefault(); ev.currentTarget.classList.add('over'); }
function mkLeave(ev){ ev.currentTarget.classList.remove('over'); }

/* ---------- render ---------- */
function mkItemRow(it){
  const s = MK_STATUS[it.status]||MK_STATUS.rascunho;
  const meta = [it.versao?'v'+pfEsc(it.versao):'', it.periodo?pfEsc(it.periodo):'', it.tipo==='arquivo'?mkTam(it.tam):'', mkData(it.atualizado)].filter(Boolean).join(' · ');
  return `<li class="mk-it st-${it.status}">
    <button class="mk-ext" onclick="mkAbrir('${it.id}')" title="Abrir">${mkExt(it)}</button>
    <div class="mk-it-b" onclick="mkAbrir('${it.id}')">
      <div class="mk-it-t">${pfEsc(it.titulo)} <span class="pf-st s-${s.c}">${s.l}</span></div>
      <div class="mk-it-m">${it.tipo==='arquivo'?`<span class="mono">${pfEsc(it.nome||'')}</span> · `:''}${meta}</div>
      ${it.obs?`<div class="mk-it-o">${pfEsc(it.obs)}</div>`:''}
    </div>
    <div class="mk-it-a">
      ${it.tipo==='arquivo'?`<button class="pf-ib" title="Baixar" onclick="mkAbrir('${it.id}',true)">⤓</button>`:''}
      <button class="pf-ib" title="Nova versão" onclick="mkNovaVersao('${it.id}')">＋</button>
      <button class="pf-ib" title="Editar" onclick="mkEditar('${it.id}')">✎</button>
      ${it.status!=='arquivado'?`<button class="pf-ib" title="Arquivar" onclick="mkStatus('${it.id}','arquivado')">▣</button>`:`<button class="pf-ib" title="Reativar" onclick="mkStatus('${it.id}','vigente')">↺</button>`}
      <button class="pf-ib del" title="Excluir" onclick="mkExcluir('${it.id}')">×</button>
    </div></li>`;
}
function mkGroup(prodId, nome, cor, sub){
  const its = mkItensDe(prodId), vig = mkTemVigente(prodId);
  return `<section class="mk-g ${its.length?'':'vazio'}" ondragover="mkOver(event)" ondragleave="mkLeave(event)" ondrop="mkDrop(event,'${prodId}')">
    <header><i class="pf-dot" style="background:${cor}"></i><b>${pfEsc(nome)}</b>${sub?`<small>${pfEsc(sub)}</small>`:''}
      <span class="mk-cov ${vig?'ok':''}">${vig?'✓ plano vigente':'sem plano vigente'}</span>
      <button class="btn btn-g btn-sm" onclick="mkNovo('${prodId}')">+ Plano</button></header>
    ${its.length?`<ul class="mk-list">${its.map(mkItemRow).join('')}</ul>`:`<div class="mk-drop-hint">Arraste o arquivo aqui ou clique em + Plano</div>`}
  </section>`;
}
function mkFormHtml(){
  const f = mkForm; if(!f) return '';
  return `<div class="mk-form" id="mk-form" ondragover="mkOver(event)" ondragleave="mkLeave(event)" ondrop="mkDrop(event)">
    <div class="mk-form-h"><b>${f.id?'Editar plano':'Novo plano de marketing'}</b><button class="pf-dr-x" onclick="mkCancelar()" aria-label="Fechar">×</button></div>
    <div class="pf-form">
      <div class="pf-fld span"><label for="mk-f-prod">Produto</label><select class="finput" id="mk-f-prod" onchange="mkF('prod',this.value)">${mkProdOptions(f.prod)}</select></div>
      <div class="pf-fld span"><label for="mk-f-titulo">Título</label><input class="finput" id="mk-f-titulo" value="${pfEsc(f.titulo)}" placeholder="Ex.: Plano de lançamento — 1º trimestre" oninput="mkF('titulo',this.value)"></div>
      <div class="pf-fld"><label for="mk-f-status">Status</label><select class="finput" id="mk-f-status" onchange="mkF('status',this.value)">${Object.entries(MK_STATUS).map(([k,s])=>`<option value="${k}" ${k===f.status?'selected':''}>${s.l}</option>`).join('')}</select></div>
      <div class="pf-fld"><label for="mk-f-versao">Versão</label><input class="finput" id="mk-f-versao" value="${pfEsc(f.versao)}" oninput="mkF('versao',this.value)"></div>
      <div class="pf-fld span"><label for="mk-f-periodo">Período <small>opcional</small></label><input class="finput" id="mk-f-periodo" value="${pfEsc(f.periodo)}" placeholder="Ex.: Nov/26 – Jan/27" oninput="mkF('periodo',this.value)"></div>
      <div class="pf-fld span"><label>Conteúdo</label>
        <div class="pf-seg mk-seg"><button class="${f.tipo==='arquivo'?'on':''}" onclick="mkF('tipo','arquivo')">Arquivo</button><button class="${f.tipo==='link'?'on':''}" onclick="mkF('tipo','link')">Link (Drive, Canva, Docs…)</button></div></div>
      ${f.tipo==='link'
        ? `<div class="pf-fld span"><input class="finput mono" id="mk-f-url" value="${pfEsc(f.url||'')}" placeholder="https://docs.google.com/…" oninput="mkF('url',this.value)"></div>`
        : `<div class="pf-fld span"><label class="mk-file" for="mk-f-file">
            ${mkFile?`<b>${pfEsc(mkFile.name)}</b><small>${mkTam(mkFile.size)} · clique para trocar</small>`
              : f.nome?`<b>${pfEsc(f.nome)}</b><small>${mkTam(f.tam)} · clique ou arraste para substituir</small>`
              : `<b>Escolher arquivo</b><small>PDF, DOCX, XLSX, PPTX, imagem… até ${MK_MAX_MB} MB — ou arraste aqui</small>`}
          </label><input type="file" id="mk-f-file" hidden onchange="mkPickFile(this.files[0])"></div>`}
      <div class="pf-fld span"><label for="mk-f-obs">Observações <small>opcional</small></label><textarea class="finput pf-ta" id="mk-f-obs" rows="2" oninput="mkF('obs',this.value)">${pfEsc(f.obs)}</textarea></div>
    </div>
    <div class="pf-dr-actions"><span class="mk-prog" id="mk-prog"></span>
      <button class="btn btn-g btn-sm" onclick="mkCancelar()">Cancelar</button>
      <button class="btn btn-p btn-sm" id="mk-save" onclick="mkSalvar()">Salvar</button></div>
  </div>`;
}
function mkErrHtml(){
  if(!mkErr) return '';
  const perm = /permission/i.test(mkErr);
  return `<div class="pf-note mk-err"><b>${perm?'O Firestore bloqueou o acesso à coleção "planos".':'Erro: '+pfEsc(mkErr)}</b>
    ${perm?`Adicione esta regra em Firebase → Firestore → Regras e publique:<pre>match /planos/{uid}/{doc=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}</pre>`:''}<button class="btn btn-g btn-sm" onclick="mkErr='';mkLoaded=false;mkLoad()">Tentar de novo</button></div>`;
}
function renderMarketing(){
  const root = document.getElementById('mk-root'); if(!root || !D.portfolio) return;
  if(!mkLoaded && !mkErr){ root.innerHTML = `<div class="ph"><div><div class="pt">Planos de marketing</div><div class="ps">Carregando…</div></div></div>`; mkLoad(); return; }
  const P = pfP(), q = mkView.q.trim().toLowerCase();
  const prods = P.produtos.filter(p=>!mkView.marca || p.marca===mkView.marca);
  const ativos = MK.itens.filter(i=>i.status!=='arquivado');
  const cobertos = P.produtos.filter(p=>mkTemVigente(p.id)).length;
  const match = id => !q || mkProdNome(id).toLowerCase().includes(q) || MK.itens.some(i=>i.prod===id && (i.titulo+' '+(i.nome||'')+' '+(i.obs||'')).toLowerCase().includes(q));
  const kpis = P.marcas.map(m=>{ const ps=P.produtos.filter(p=>p.marca===m.id), c=ps.filter(p=>mkTemVigente(p.id)).length;
    return `<div class="pf-kpi click ${mkView.marca===m.id?'sel':''}" style="--mk:${m.cor}" onclick="mkView.marca=mkView.marca==='${m.id}'?'':'${m.id}';renderMarketing()">
      <div class="pf-kpi-l"><i class="pf-dot" style="background:${m.cor}"></i>${pfEsc(m.nome)}</div><div class="pf-kpi-v">${c}/${ps.length}</div>
      <div class="pf-kpi-s">produtos com plano vigente</div><div class="pf-bar"><span style="width:${ps.length?Math.round(c/ps.length*100):0}%;background:${m.cor}"></span></div></div>`; }).join('');

  const grupos = [];
  if(!mkView.marca && match(MK_GERAL)) grupos.push(mkGroup(MK_GERAL,'Geral — Candeia Tec','#64748B','planos da empresa toda'));
  P.marcas.filter(m=>!mkView.marca||m.id===mkView.marca).forEach(m=>{
    const ps = prods.filter(p=>p.marca===m.id && match(p.id));
    const temMarca = MK.itens.some(i=>i.prod==='m:'+m.id) && match('m:'+m.id);
    if(!ps.length && !temMarca) return;
    grupos.push(`<div class="mk-marca"><i class="pf-dot" style="background:${m.cor}"></i>${pfEsc(m.nome)}</div>`);
    if(temMarca) grupos.push(mkGroup('m:'+m.id,'Marca inteira',m.cor,m.nome));
    ps.forEach(p=>grupos.push(mkGroup(p.id,p.nome,m.cor,p.tipo)));
  });
  const orfaos = [...new Set(MK.itens.filter(i=>i.prod!==MK_GERAL && !i.prod.startsWith('m:') && !pfProd(i.prod)).map(i=>i.prod))];
  orfaos.forEach(id=>grupos.push(mkGroup(id,'Produto removido','#64748B','reatribua em Editar')));

  root.innerHTML = `
    <div class="ph"><div><div class="pt">Planos de marketing</div><div class="ps">${ativos.length} plano(s) ativos · ${cobertos} de ${P.produtos.length} produtos com plano vigente</div></div>
      <div class="pa"><button class="btn btn-p" onclick="mkNovo()">+ Adicionar plano</button></div></div>
    ${mkErrHtml()}
    ${mkFormHtml()}
    <div class="pf-kpis">${kpis}</div>
    <div class="pf-toolbar mk-tb">
      <input class="finput mk-search" placeholder="Buscar plano ou produto…" value="${pfEsc(mkView.q)}" oninput="mkView.q=this.value;clearTimeout(window._mkq);window._mkq=setTimeout(()=>{renderMarketing();const s=document.querySelector('.mk-tb .mk-search');if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length);}},250)">
      <label class="mk-chk"><input type="checkbox" ${mkView.arquivados?'checked':''} onchange="mkView.arquivados=this.checked;renderMarketing()"> Mostrar arquivados</label>
    </div>
    ${grupos.join('') || `<div class="pf-empty">Nada encontrado.</div>`}`;
  mkBadge();
}

/* ---------- aba "Marketing" no painel do produto ---------- */
(function(){
  if(typeof pfRenderDrawer!=='function') return;
  const orig = pfRenderDrawer;
  pfRenderDrawer = function(){
    if(pfTab!=='marketing') return orig();
    const p = pfProd(pfOpenId), box = document.getElementById('pf-dr-body'); if(!p||!box) return;
    pfRenderDrawerHead();
    document.querySelectorAll('.pf-tab').forEach(b=>b.classList.toggle('on', b.dataset.tab===pfTab));
    if(!mkLoaded){ box.innerHTML = mkErr ? mkErrHtml() : '<div class="pf-empty sm">Carregando…</div>'; mkLoad(); return; }
    const its = MK.itens.filter(i=>i.prod===p.id || i.prod==='m:'+p.marca)
      .sort((a,b)=>(a.status==='vigente'?0:1)-(b.status==='vigente'?0:1) || String(b.atualizado||'').localeCompare(String(a.atualizado||'')));
    box.innerHTML = `<div class="pf-note">${mkTemVigente(p.id)?'Plano vigente cadastrado.':'<b>Sem plano vigente.</b>'} Inclui os planos da marca inteira.</div>
      ${its.length?`<ul class="mk-list">${its.map(mkItemRow).join('')}</ul>`:'<div class="pf-empty sm">Nenhum plano ainda.</div>'}
      <div class="pf-dr-actions"><button class="btn btn-p btn-sm" onclick="pfClose();mkNovo('${p.id}')">+ Adicionar plano</button>
      <button class="btn btn-g btn-sm" onclick="pfClose();go('marketing')">Ver todos</button></div>`;
  };
})();

/* carrega assim que o login terminar */
(function mkWait(){ if(typeof currentUID!=='undefined' && currentUID && typeof D!=='undefined' && D.portfolio){ mkLoad(); } else setTimeout(mkWait, 600); })();

/* re-render junto com o portfólio */
(function(){
  if(typeof renderPortfolioAll!=='function') return;
  const orig = renderPortfolioAll;
  renderPortfolioAll = function(){ orig(); renderMarketing(); };
})();
