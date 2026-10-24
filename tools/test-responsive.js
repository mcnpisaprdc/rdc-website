const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const root = path.resolve(__dirname, '..');
const executablePath = process.env.BROWSER_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(file => fs.existsSync(file));
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

async function main() {
  assert.ok(executablePath, 'Set BROWSER_PATH to a Chrome or Edge executable.');
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath, headless: true });
    const page = await browser.newPage();
    const origin = `http://127.0.0.1:${server.address().port}`;
    // Keep the test offline apart from its local server.
    await page.setRequestInterception(true);
    page.on('request', req => req.url().startsWith(origin + '/') || req.url().startsWith('data:') ? req.continue() : req.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewport({ width, height: 900, isMobile: width < 800, hasTouch: width < 800 });
      for (const file of ['index.html', 'calendar.html', 'news-events.html', 'utilization.html', 'about-mcnp.html', 'about-rdc.html', 'contact.html', 'resources.html']) {
        errors.length = 0;
        await page.goto(`${origin}/${file}`, { waitUntil: 'networkidle0' });
        const actualWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(actualWidth <= width + 1, `${file} at ${width}px overflows to ${actualWidth}px`);
        assert.deepEqual(errors, [], `${file} has browser errors`);
        if (file === 'index.html') {
          assert.equal(await page.$$eval('main', els => els.length), 1);
          assert.equal(await page.$$eval('h1', els => els.length), 1);
          assert.ok(await page.$('main h1'));
        }
        if (file === 'contact.html') {
          assert.ok(await page.$$eval('#onlineInquiryForm input, #onlineInquiryForm select, #onlineInquiryForm textarea', els => els.every(el => el.labels.length === 1)));
          assert.equal(await page.$eval('#onlineInquiryForm button[type="submit"]', el => el.textContent.trim()), 'Open Email Draft');
        }
        if (file === 'resources.html') {
          const count = () => page.$eval('#visibleDocCount', el => el.textContent);
          const activate = async selector => {
            await page.focus(selector);
            await page.keyboard.press('Enter');
          };
          assert.match(await count(), /1 available resource group \(4 form downloads\)/);
          await activate('[data-filter="isap"]');
          assert.match(await count(), /1 available resource group/);
          await activate('[data-course="it"]');
          assert.match(await count(), /1 available resource group/);
          await activate('[data-course="nursing"]');
          assert.match(await count(), /^0 available/);
          assert.equal(await page.$eval('#docEmptyState', el => getComputedStyle(el).display), 'block');
          await page.evaluate(() => resetDocFilters());
          await activate('[data-filter="video"]');
          assert.match(await count(), /^0 available.*1 video preview/);
          await page.evaluate(() => resetDocFilters());
          assert.equal(await page.$$eval('.doc-filter-btn[aria-pressed="true"], .course-pill[aria-pressed="true"]', els => els.length), 2);
          const links = await page.$$eval('#uni-item-12 a[download]', els => els.map(el => el.getAttribute('href')));
          assert.equal(links.length, 4);
          links.forEach(href => assert.ok(fs.existsSync(path.join(root, decodeURIComponent(href))), href));
        }
        if (width < 800) {
          await page.click('.mobile-toggle');
          assert.equal(await page.$eval('.mobile-toggle', el => el.getAttribute('aria-expanded')), 'true');
          await page.click('.mobile-toggle');
          assert.equal(await page.$eval('.mobile-toggle', el => el.getAttribute('aria-expanded')), 'false');
        }
        console.log(`PASS ${file} at ${width}px`);
      }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
