// Gera os PNGs do WhatsApp Business a partir de capa.html e perfil.html.
// Uso (na raiz do repositório):  node marca/whatsapp/gerar.js   (requer: npm i -g playwright)
const {chromium}=require('playwright');const path=require('path');
const dir=__dirname, url=f=>'file://'+path.join(dir,f);
(async()=>{
  const b=await chromium.launch();
  const shot=async(file,w,h,scale,out)=>{const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:scale});
    await p.goto(url(file),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
    await p.screenshot({path:path.join(dir,out)});await p.close();};
  await shot('capa.html',1920,1080,1,'capa-whatsapp-1920x1080.png');
  await shot('capa.html',1920,1080,1211/1920,'capa-whatsapp-1211x681.png');
  await shot('perfil.html',800,800,1,'perfil-whatsapp-800.png');
  // prévia: como aparece no app (faixa ~2:1, foto redonda sobre o centro de baixo, tema escuro)
  const fs=require('fs'), prev=path.join(dir,'_previa.html');
  fs.writeFileSync(prev,`<body style="margin:0;background:#0B141A;font-family:system-ui">
    <div style="height:370px;background:url('capa-whatsapp-1920x1080.png') center/cover"></div>
    <img src="perfil-whatsapp-800.png" style="position:absolute;left:241px;top:205px;width:256px;height:256px;border-radius:50%;border:6px solid #0B141A">
    <div style="color:#E9EDEF;font-size:44px;font-weight:700;text-align:center;margin-top:120px">Candeia Tec</div>
    <div style="color:#8696A0;font-size:26px;text-align:center;margin-top:10px">Conta comercial</div></body>`);
  const p=await b.newPage({viewport:{width:738,height:760}});
  await p.goto(url('_previa.html'));await p.waitForTimeout(400);await p.screenshot({path:path.join(dir,'previa-whatsapp.png')});
  fs.unlinkSync(prev);
  await b.close();console.log('ok');
})();
