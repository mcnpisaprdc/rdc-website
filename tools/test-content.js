const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const puppeteer = require('puppeteer-core');
const { newsRecords, projectRecords } = require('./build-content');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const context = { window: {} };
vm.runInNewContext(read('js/pages/content-index.js'), context);
const records = context.window.RDC_CONTENT;
const sources = [...newsRecords(read('news-events.html')), ...projectRecords(read('js/pages/utilization.js'))];
for (const source of sources) {
  const result = records.find(r => r.id === source.id);
  assert.ok(result, source.id);
  assert.equal(JSON.stringify(result.g), JSON.stringify(source.g));
  assert.equal(result.t, source.t);
  assert.equal(result.url, source.url);
}
assert.equal(records.length, sources.length + 1, 'Preserve unmatched legacy listing');
assert.ok(records.find(r => r.sourceNote && r.id === 'event-sdg-research-snap-tourism'));
async function main() {
  const executablePath = process.env.BROWSER_PATH || ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader('Content-Type', {'.html':'text/html','.js':'application/javascript','.css':'text/css'}[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath, headless: true });
    const page = await browser.newPage();
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.setRequestInterception(true);
    page.on('request', req => req.url().startsWith(origin) || req.url().startsWith('data:') ? req.continue() : req.abort());
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const key of ['inspire','nurture','navigate','operationalize','value','advance','transform','expand','strengthen']) {
      await page.goto(origin + '/rdc-agenda.html#pillar-' + key, {waitUntil:'domcontentloaded'});
      await page.waitForSelector('#agendaModal.active');
      assert.ok((await page.$eval('#agendaModalTitle', e => e.textContent)).toLowerCase().includes(key));
    }
    await page.evaluate(() => { location.hash = '#pillar-navigate'; });
    await page.waitForFunction(() => document.querySelector('#agendaModalTitle').textContent.toLowerCase().includes('navigate'));
    await page.evaluate(() => closeAgendaModal());
    assert.equal(new URL(page.url()).hash, '');
    await page.goto(origin + '/rdc-agenda.html#pillar-invalid', {waitUntil:'domcontentloaded'});
    assert.equal(await page.$('#agendaModal.active'), null);
    for (let goal = 1; goal <= 17; goal++) {
      await page.goto(origin + '/sdg-overview.html?goal=' + goal, {waitUntil:'domcontentloaded'});
      assert.equal(await page.$$eval('.un-ev', els => els.length), records.filter(r => r.g.includes(goal)).length);
    }
    for (const record of records.filter(r => r.url.startsWith('utilization.html'))) {
      await page.goto(origin + '/' + record.url, {waitUntil:'networkidle0'});
      assert.ok(await page.$eval('#utilArticleModalOverlay', el => el.classList.contains('active') || getComputedStyle(el).display !== 'none'));
    }
    for (const file of ['about-mcnp.html', 'about-isap.html']) {
      await page.goto(origin + '/' + file, {waitUntil:'domcontentloaded'});
      assert.equal(await page.$eval('video', e => e.getAttribute('aria-describedby')), 'hymn-accessibility');
      assert.ok(await page.$('#hymn-accessibility a[href="contact.html"]'));
      assert.equal(await page.$('video track'), null, 'Do not fabricate approved captions');
    }
    for (const [file, ids] of [['about-rdc.html',['qmsSearchInput','faqSearchInput']],['calendar.html',['calendarSearchInput']],['contact.html',['faqSearchInput']]]) {
      await page.goto(origin + '/' + file, {waitUntil:'domcontentloaded'});
      for (const id of ids) assert.equal(await page.$eval('#' + id, e => e.labels.length), 1);
    }
    for (const file of ['news.html','schedule-calendar.html']) {
      await page.goto(origin + '/' + file, {waitUntil:'networkidle0'});
      assert.ok(!new URL(page.url()).pathname.endsWith('/' + file), file + ' redirects');
    }
    assert.deepEqual(errors, []);
    console.log('Content coverage, agenda deep links, labels and redirects passed.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
