/* Apps nas lojas — matriz de uniformidade dos apps (Google Play e App Store).
   Lê apps/catalogo.json (fonte única, no repositório) e aponta o que falta ou está fora do padrão.
   Depende de: go(), pfEsc() (portfolio.js). */

const LJ_URL = '../apps/catalogo.json';
let LJ = null, ljErr = '', ljLoading = null;
let ljView = {loja:'todas', pend:false, sec:''};
try{ Object.assign(ljView, JSON.parse(localStorage.getItem('corujalabs_lj_view')||'{}')); }catch(e){}
function ljSaveView(){ try{ localStorage.setItem('corujalabs_lj_view', JSON.stringify(ljView)); }catch(e){} }

function ljLoad(){
  if(LJ || ljLoading) return ljLoading;
  ljLoading = fetch(LJ_URL+'?nc='+Date.now()).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(j=>{ LJ=j; ljErr=''; }).catch(e=>{ ljErr=String(e.message||e); })
    .finally(()=>{ ljLoading=null; renderLojas(); });
  return ljLoading;
}

/* ---------- regras (as mesmas de apps/PADRAO.md e apps/gerar_planilha.py) ---------- */
const ljVazio = v => v==null || String(v).trim()==='' || /^x{3,}$/i.test(String(v).trim());
const ljNA = v => /^n\/?a$/i.test(String(v||'').trim());
function ljTemIos(app){ const p=String(app.plataformas||''); return /ios/i.test(p) && !/ios planejad/i.test(p); }
function ljBase(app){
  const d = ljVazio(app.dominio) ? '' : app.dominio;
  return d || LJ.padrao.urlBaseSemDominio.replace('{slug}', app.slug||'app');
}
function ljEsperado(campo, app){
  const r = campo.regra||'';
  if(r.startsWith('url:')) return LJ.padrao.urls[r.slice(4)].replace('{base}', ljBase(app));
  if(r==='emailSuporte') return ljVazio(app.dominio) ? '' : LJ.padrao.emailSuporte.replace('{dominio}', app.dominio);
  if(r==='copyright') return LJ.padrao.copyright;
  if(r==='desenvolvedor') return LJ.padrao.desenvolvedor;
  return '';
}
/* estado: ok | warn | falta | vazio | na  (+ motivo) */
function ljAvaliar(campo, app){
  if(campo.loja==='apple' && !ljTemIos(app)) return {st:'na', msg:'Sem iOS por enquanto'};
  const v = app[campo.id], s = v==null ? '' : String(v).trim();
  if(ljNA(s)) return {st:'na', msg:'Não se aplica'};
  const esp = ljEsperado(campo, app);
  if(ljVazio(s)) return {st: campo.obrig?'falta':'vazio', msg: campo.obrig?'Obrigatório':'Opcional', esp};
  if(campo.max && s.length > campo.max) return {st:'warn', msg:`${s.length} caracteres (máx. ${campo.max})`};
  if(campo.tipo==='url' && !/^https:\/\/[^\s]+\.[^\s]+/.test(s)) return {st:'warn', msg:'Use o link completo com https://'};
  if(campo.tipo==='email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return {st:'warn', msg:'E-mail inválido'};
  if(campo.regra==='copyright' && !/^© \d{4} Candeia Tec$/.test(s)) return {st:'warn', msg:'Fora do padrão', esp};
  if(campo.regra==='desenvolvedor' && s!==esp) return {st:'warn', msg:'Fora do padrão', esp};
  if((campo.regra||'').startsWith('url:') && s.replace(/\/?$/,'/')!==esp) return {st:'warn', msg:'Fora do padrão', esp};
  if(campo.regra==='emailSuporte' && esp && s.toLowerCase()!==esp) return {st:'warn', msg:'Fora do padrão', esp};
  if(campo.regra==='targetSdk' && (parseInt(s,10)||0) < 36) return {st:'warn', msg:'Google Play exige API 36 desde 31/08/2026'};
  return {st:'ok'};
}
function ljCamposVisiveis(){
  return LJ.campos.filter(c=> ljView.loja==='todas' || c.loja==='geral' || c.loja===ljView.loja);
}
function ljPlacar(app, loja){
  const cs = LJ.campos.filter(c=>c.obrig && (loja==='todas' || c.loja==='geral' || c.loja===loja));
  let ok=0, tot=0, warn=0;
  cs.forEach(c=>{ const r=ljAvaliar(c, app); if(r.st==='na') return; tot++; if(r.st==='ok') ok++; if(r.st==='warn') warn++; });
  return {ok, tot, warn, pct: tot ? Math.round(ok/tot*100) : 100};
}

/* ---------- render ---------- */
function ljSet(k, v){ ljView[k] = v; ljSaveView(); renderLojas(); }
function ljCell(campo, app){
  const r = ljAvaliar(campo, app), v = app[campo.id];
  const ic = {ok:'✓', warn:'!', falta:'✕', vazio:'', na:'—'}[r.st];
  let txt = '';
  if(r.st==='ok' || r.st==='warn'){
    const s = String(v);
    txt = campo.max && campo.max>=170 ? `${s.length}/${campo.max} car.` : s;
  } else if(r.st==='na') txt = r.msg==='Sem iOS por enquanto' ? '' : 'n/a';
  const tip = [campo.rotulo, r.st==='ok'||r.st==='warn' ? String(v) : '', r.msg||'', r.esp?'Padrão: '+r.esp:'', campo.dica?'Dica: '+campo.dica:''].filter(Boolean).join('\n');
  const esp = (r.st==='falta'||r.st==='warn'||r.st==='vazio') && r.esp ? `<small class="lj-esp">${pfEsc(r.esp)}</small>` : '';
  const isUrl = (r.st==='ok'||r.st==='warn') && /^https?:\/\//.test(String(v));
  return `<td class="lj-c lj-${r.st}" title="${pfEsc(tip)}"><span class="lj-ic">${ic}</span>${isUrl?`<a href="${pfEsc(v)}" target="_blank" rel="noopener">${pfEsc(txt.replace(/^https:\/\//,''))}</a>`:`<span class="lj-v">${pfEsc(txt)}</span>`}${esp}</td>`;
}
function renderLojas(){
  const root = document.getElementById('lj-root'); if(!root) return;
  if(!LJ && !ljErr){ root.innerHTML = '<div class="ph"><div><div class="pt">Apps nas lojas</div><div class="ps">Carregando o catálogo…</div></div></div>'; ljLoad(); return; }
  if(ljErr){ root.innerHTML = `<div class="ph"><div><div class="pt">Apps nas lojas</div></div></div><div class="pf-note mk-err"><b>Não consegui ler apps/catalogo.json</b> (${pfEsc(ljErr)}). <button class="btn btn-g btn-sm" onclick="ljErr='';ljLoad()">Tentar de novo</button></div>`; return; }

  const apps = LJ.apps, campos = ljCamposVisiveis();
  const kpis = apps.map(a=>{ const p=ljPlacar(a, ljView.loja); const cor = p.pct>=80?'#16A34A':p.pct>=50?'#D97706':'#DC2626';
    return `<div class="pf-kpi"><div class="pf-kpi-l">${pfEsc(a.nome)}</div><div class="pf-kpi-v" style="color:${cor}">${p.pct}%</div>
      <div class="pf-kpi-s">${p.ok}/${p.tot} obrigatórios ok${p.warn?` · ${p.warn} fora do padrão`:''}</div><div class="pf-bar"><span style="width:${p.pct}%;background:${cor}"></span></div></div>`; }).join('');

  const linhas = LJ.secoes.map(sec=>{
    const cs = campos.filter(c=>c.secao===sec.id).filter(c=> !ljView.pend || apps.some(a=>['falta','warn'].includes(ljAvaliar(c,a).st)));
    if(!cs.length) return '';
    return `<tr class="lj-sec"><th colspan="${apps.length+1}">${pfEsc(sec.nome)}</th></tr>` + cs.map(c=>`<tr>
      <th class="lj-f" title="${pfEsc(c.dica||'')}"><span class="lj-loja lj-${c.loja}">${{play:'Play',apple:'Apple',geral:'Ambas'}[c.loja]}</span>${pfEsc(c.rotulo)}${c.obrig?'':' <small>opcional</small>'}</th>
      ${apps.map(a=>ljCell(c,a)).join('')}</tr>`).join('');
  }).join('');

  const total = {falta:0, warn:0};
  apps.forEach(a=>LJ.campos.forEach(c=>{ const s=ljAvaliar(c,a).st; if(s in total) total[s]++; }));

  root.innerHTML = `
    <div class="ph"><div><div class="pt">Apps nas lojas</div>
      <div class="ps">${apps.length} apps · ${total.falta} campos obrigatórios faltando · ${total.warn} fora do padrão · catálogo de ${pfEsc(LJ.atualizado)}</div></div>
      <div class="pa"><button class="btn btn-g btn-sm" onclick="ljCsv()">⤓ Baixar planilha (CSV)</button></div></div>
    <div class="pf-note">Padrão Candeia Tec: copyright <b>${pfEsc(LJ.padrao.copyright)}</b> · suporte <b>contato@domínio-do-app</b> · páginas em <b>/privacidade/ /termos/ /excluir-conta/ /suporte/</b>. Os dados ficam em <span class="mono">apps/catalogo.json</span> no repositório: peça a atualização ao Claude. Passe o mouse numa célula para ver o detalhe.</div>
    <div class="pf-kpis">${kpis}</div>
    <div class="pf-toolbar">
      <div class="pf-seg" style="margin-left:0">${[['todas','Todas as lojas'],['play','Google Play'],['apple','App Store']].map(([k,l])=>`<button class="${ljView.loja===k?'on':''}" onclick="ljSet('loja','${k}')">${l}</button>`).join('')}</div>
      <label class="mk-chk"><input type="checkbox" ${ljView.pend?'checked':''} onchange="ljSet('pend',this.checked)"> Só linhas com pendência</label>
      <span class="lj-leg"><i class="lj-ok">✓</i>ok <i class="lj-warn">!</i>fora do padrão <i class="lj-falta">✕</i>falta <i class="lj-na">—</i>não se aplica</span>
    </div>
    <div class="lj-wrap"><table class="lj-t">
      <thead><tr><th class="lj-f">Campo</th>${apps.map(a=>`<th class="lj-app">${pfEsc(a.nome)}<small>${pfEsc(a.status||'')}</small></th>`).join('')}</tr></thead>
      <tbody>${linhas || `<tr><td colspan="${apps.length+1}" class="pf-empty sm">Nenhuma pendência nesse filtro.</td></tr>`}</tbody>
    </table></div>
    <h3 class="lj-h3">Marcas e perfis</h3>
    <div class="pf-table-wrap"><table class="pf-table"><thead><tr><th>Marca</th><th>Papel</th><th>Site</th><th>Privacidade</th><th>Instagram</th><th>E-mail</th></tr></thead><tbody>
      ${LJ.marcas.map(m=>`<tr><td><b>${pfEsc(m.nome)}</b>${m.obs?`<div class="pf-sub">${pfEsc(m.obs)}</div>`:''}</td><td>${pfEsc(m.papel)}</td>
        <td>${m.site?`<a href="${pfEsc(m.site)}" target="_blank" rel="noopener">${pfEsc(m.site.replace(/^https:\/\//,''))}</a>`:'<span class="lj-miss">—</span>'}</td>
        <td>${m.privacidade?'✓':'<span class="lj-miss">falta</span>'}</td><td>${pfEsc(m.instagram||'—')}</td><td>${pfEsc(m.email||'—')}</td></tr>`).join('')}
    </tbody></table></div>`;
}

/* CSV para abrir no Excel (separador ; e BOM para acentos) */
function ljCsv(){
  if(!LJ) return;
  const q = v => '"'+String(v??'').replace(/"/g,'""')+'"';
  const rows = [['Seção','Campo','Loja', ...LJ.apps.map(a=>a.nome)]];
  LJ.secoes.forEach(s=>LJ.campos.filter(c=>c.secao===s.id).forEach(c=>rows.push([s.nome, c.rotulo, {play:'Google Play',apple:'App Store',geral:'Ambas'}[c.loja],
    ...LJ.apps.map(a=>{ const r=ljAvaliar(c,a), v=a[c.id]; return r.st==='ok'?v : r.st==='warn'?`${v}  [! ${r.msg}${r.esp?' — padrão: '+r.esp:''}]` : r.st==='falta'?`[FALTA${r.esp?' — padrão: '+r.esp:''}]` : r.st==='na'?'n/a' : ''; })])));
  const blob = new Blob(['﻿'+rows.map(r=>r.map(q).join(';')).join('\r\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'STATUS_APLICATIVOS.csv';
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* renderiza ao abrir a página */
(function(){
  const orig = go;
  go = function(p){ orig(p); if(p==='lojas') renderLojas(); };
})();
