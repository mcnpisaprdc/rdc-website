const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');
const puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/pages/content-index.js'), 'utf8'), context);
const records = context.window.RDC_CONTENT;
async function main() {
  const executablePath = process.env.BROWSER_PATH || ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader('Content-Type', { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath, headless: true });
    const page = await browser.newPage();
    const origin = 'http://127.0.0.1:' + server.address().port;
    await page.setRequestInterception(true);
    page.on('request', req => req.url().startsWith(origin + '/') ? req.continue() : req.abort());
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/adg-advocacy.html', { waitUntil: 'domcontentloaded' });
    assert.equal(await page.$$eval('.sdg-pure-card', els => els.length), 17);
    for (let goal = 1; goal <= 17; goal++) {
      const count = records.filter(r => r.g.includes(goal)).length;
      const selector = '.sdg-pure-card[href="sdg-overview.html?goal=' + goal + '"]';
      assert.equal(await page.$eval(selector + ' .sdg-count-badge', el => el.textContent), count ? count + (count === 1 ? ' Item' : ' Items') : 'No items yet');
      assert.ok((await page.$eval(selector, el => el.getAttribute('aria-label'))).includes(count + ' documented item'));
    }
    const summary = await page.$eval('.sdg-total-note', el => el.textContent);
    assert.ok(summary.includes(records.length + ' distinct documented items'));
    assert.ok(summary.includes('across ' + new Set(records.flatMap(r => Array.from(r.g))).size + ' of the 17 goals'));
    assert.ok(summary.includes('One activity may support multiple SDGs'));
    console.log('Main page totals and all 17 card counts passed.');
    for (let goal = 1; goal <= 17; goal++) {
      await page.goto(origin + '/sdg-overview.html?goal=' + goal, { waitUntil: 'domcontentloaded' });
      const count = records.filter(r => r.g.includes(goal)).length;
      assert.equal(await page.$$eval('.un-ev', els => els.length), count);
      assert.equal(await page.$eval('#un-ev-count-badge', el => el.textContent), count + (count === 1 ? ' Item' : ' Items'));
    }
    assert.deepEqual(errors, []);
    console.log('All 17 detail page counts match; no browser errors.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
