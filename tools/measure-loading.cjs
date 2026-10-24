const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req,res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    const ext = path.extname(file);
    res.setHeader('Content-Type', {'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp'}[ext] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0,'127.0.0.1',r));
  let browser;
  try {
    browser = await puppeteer.launch({headless:true, executablePath:process.env.BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (let run=1;run<=3;run++) {
      const page = await browser.newPage();
      await page.setViewport({width:1440,height:900});
      await page.setCacheEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', r => r.url().startsWith(origin+'/') || r.url().startsWith('data:') ? r.continue() : r.abort());
      await page.evaluateOnNewDocument(() => {
        window.localLcp = [];
        new PerformanceObserver(list => window.localLcp.push(...list.getEntries().map(e => ({time:e.startTime,element:e.element?.className,url:e.url})))).observe({type:'largest-contentful-paint',buffered:true});
      });
      await page.goto(origin+'/index.html',{waitUntil:'networkidle0'});
      console.log(JSON.stringify(await page.evaluate(run => {
        const resources=performance.getEntriesByType('resource').filter(r=>r.name.startsWith(location.origin));
        const hero=resources.find(r=>r.name.endsWith('/assets/rdc-logo.webp'));
        return {run,dcl:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,localBytes:resources.reduce((s,r)=>s+r.transferSize,0),requests:resources.length,hero:hero&&{start:hero.startTime,end:hero.responseEnd,bytes:hero.transferSize},lcp:window.localLcp.at(-1),largest:resources.sort((a,b)=>b.transferSize-a.transferSize).slice(0,4).map(r=>({url:r.name.replace(location.origin,''),bytes:r.transferSize}))};
      },run)));
      await page.close();
    }
  } finally { if(browser) await browser.close(); await new Promise(r=>server.close(r)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
