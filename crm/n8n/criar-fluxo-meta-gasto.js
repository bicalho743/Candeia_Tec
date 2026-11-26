// Script usado em 24/11/2026 (colado no console do n8n, já logado) para criar o fluxo
// "CRM — Gasto diário do Meta Ads" (R9Gyn15TxNgZWflS). Fica como referência; o fluxo já existe no n8n.
// Não tem chave: a credencial do Meta é escolhida dentro do n8n.
const h={'browser-id':localStorage.getItem('n8n-browserId')||'','content-type':'application/json'};
const mapa = `// Converte o relatório do Meta (nível anúncio, por dia) em linhas da tabela gastos_campanha.
const out = [];
for (const item of $input.all()) {
  for (const r of (item.json.data || [])) {
    const res = (r.actions || []).filter(a => ['lead','purchase','onsite_conversion.messaging_conversation_started_7d','offsite_conversion.fb_pixel_purchase','offsite_conversion.fb_pixel_lead','complete_registration','offsite_conversion.fb_pixel_complete_registration'].includes(a.action_type))
      .reduce((s, a) => s + Number(a.value || 0), 0);
    out.push({ json: {
      plataforma: 'meta', dia: r.date_start, conta_id: r.account_id || null,
      campanha_id: r.campaign_id, campanha: r.campaign_name || null, conjunto: r.adset_name || null,
      anuncio_id: r.ad_id || '', anuncio: r.ad_name || null,
      gasto: Number(r.spend || 0), impressoes: Number(r.impressions || 0), cliques: Number(r.clicks || 0),
      resultados: res, atualizado_em: new Date().toISOString()
    }});
  }
}
return out;`;
const N=(name,type,tv,pos,parameters,credentials)=>({id:crypto.randomUUID(),name,type,typeVersion:tv,position:pos,parameters,...(credentials?{credentials}:{})});
const wf={name:'CRM — Gasto diário do Meta Ads',settings:{executionOrder:'v1'},
 nodes:[
  N('Todo dia às 6h','n8n-nodes-base.scheduleTrigger',1.2,[0,0],{rule:{interval:[{field:'days',triggerAtHour:6}]}}),
  N('Contas de anúncio','n8n-nodes-base.httpRequest',4.2,[220,0],{url:'https://graph.facebook.com/v21.0/me/adaccounts',authentication:'predefinedCredentialType',nodeCredentialType:'facebookGraphApi',sendQuery:true,queryParameters:{parameters:[{name:'fields',value:'id,name,account_status'},{name:'limit',value:'50'}]},options:{}}),
  N('Uma por vez','n8n-nodes-base.splitOut',1,[440,0],{fieldToSplitOut:'data',options:{}}),
  N('Gasto por anúncio (7 dias)','n8n-nodes-base.httpRequest',4.2,[660,0],{url:'=https://graph.facebook.com/v21.0/{{ $json.id }}/insights',authentication:'predefinedCredentialType',nodeCredentialType:'facebookGraphApi',sendQuery:true,queryParameters:{parameters:[{name:'level',value:'ad'},{name:'time_increment',value:'1'},{name:'date_preset',value:'last_7d'},{name:'fields',value:'account_id,campaign_id,campaign_name,adset_name,ad_id,ad_name,spend,impressions,clicks,actions'},{name:'limit',value:'500'}]},options:{}}),
  N('Preparar linhas','n8n-nodes-base.code',2,[880,0],{jsCode:mapa}),
  N('Gravar no CRM','n8n-nodes-base.httpRequest',4.2,[1100,0],{method:'POST',url:'https://zottntimhhsgwsgtvguz.supabase.co/rest/v1/gastos_campanha?on_conflict=plataforma,dia,campanha_id,anuncio_id',authentication:'predefinedCredentialType',nodeCredentialType:'supabaseApi',sendHeaders:true,headerParameters:{parameters:[{name:'Prefer',value:'resolution=merge-duplicates,return=minimal'}]},sendBody:true,specifyBody:'json',jsonBody:'={{ JSON.stringify($json) }}',options:{batching:{batch:{batchSize:50,batchInterval:200}}}},{supabaseApi:{id:'cD0MJ9DZr4DDQPvZ',name:'Supabase account'}})
 ],
 connections:{
  'Todo dia às 6h':{main:[[{node:'Contas de anúncio',type:'main',index:0}]]},
  'Contas de anúncio':{main:[[{node:'Uma por vez',type:'main',index:0}]]},
  'Uma por vez':{main:[[{node:'Gasto por anúncio (7 dias)',type:'main',index:0}]]},
  'Gasto por anúncio (7 dias)':{main:[[{node:'Preparar linhas',type:'main',index:0}]]},
  'Preparar linhas':{main:[[{node:'Gravar no CRM',type:'main',index:0}]]}
 }};
const r=await fetch('/rest/workflows',{method:'POST',headers:h,body:JSON.stringify(wf)}); const j=await r.json(); r.status+' '+(j.data?j.data.id+' active='+j.data.active:JSON.stringify(j).slice(0,300));
