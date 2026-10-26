const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
async function main() {
  const ctx = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/pages/social-data.js'),'utf8'),ctx);
  const server = http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader('Content-Type', {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.jpg':'image/jpeg'}[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try {
    browser=await puppeteer.launch({headless:true,executablePath:process.env.BROWSER_PATH || ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync)});
    const page=await browser.newPage();
    const origin='http://127.0.0.1:'+server.address().port;
    await page.setRequestInterception(true);
    page.on('request',req=>req.url().startsWith(origin)||req.url().startsWith('data:')?req.continue():req.abort());
    for(const [id,m] of Object.entries(ctx.window.RDC_SOCIAL)) {
      const image=await sharp(path.join(root,'assets/social',id+'.jpg')).metadata();
      assert.equal(image.width,1200); assert.equal(image.height,630);
      await page.setJavaScriptEnabled(false);
      await page.goto(origin+'/share/'+id+'.html');
      const get=()=>page.evaluate(()=>Object.fromEntries(Array.from(document.head.querySelectorAll('meta')).map(e=>[e.getAttribute('property')||e.name,e.content])));
      const raw=await get();
      assert.equal(raw['og:title'],m.title); assert.equal(raw['og:image'],m.image);
      await page.setJavaScriptEnabled(true);
      await page.reload({waitUntil:'networkidle0'});
      const live=await get();
      for(const key of ['description','og:title','og:description','og:image','og:url','og:type','og:image:width','og:image:height','twitter:title','twitter:description','twitter:image','twitter:image:alt']) assert.equal(live[key],raw[key],id+': '+key);
      const route=page.url().includes('utilization.html')?'utilization.html':'news-events.html';
      await page.goto(origin+'/'+route+'?article='+id,{waitUntil:'networkidle0'});
      assert.equal((await get())['og:image'],m.image);
      await page.evaluate((util)=>util?window.closeUtilArticleModal():window.closeArticleModal(),route==='utilization.html');
      assert.equal((await get())['og:type'],'website');
      await page.goto(origin+'/'+route+'#'+id,{waitUntil:'networkidle0'});
      assert.equal((await get())['og:title'],m.title);
      console.log('PASS static/share redirect/query/hash/close: '+id);
    }
    console.log('All 11 article previews passed in headless Chromium.');
  } finally { if(browser) await browser.close(); await new Promise(r=>server.close(r)); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
