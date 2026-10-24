const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

(async () => {
  const executablePath = process.env.BROWSER_PATH || [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].find(file => fs.existsSync(file));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', req => /^(file:|data:)/.test(req.url()) ? req.continue() : req.abort());
    for (const width of [320, 768, 1440]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'utilization.html')).href, { waitUntil: 'networkidle0' });
      const errors = await page.evaluate(async () => {
        const errors = [];
        for (const article of getAllUtilizationArticles()) {
          openUtilArticleModal(article.id);
          const images = [...document.querySelectorAll('.article-card-thumb-wrap img, .util-photo-gallery img, .article-featured-hero img')];
          for (const img of images) {
            img.loading = 'eager';
            try { await img.decode(); } catch { errors.push('Failed image: ' + img.src); continue; }
            const style = getComputedStyle(img);
            const rect = img.getBoundingClientRect();
            if (!rect.width || !rect.height) continue;
            const naturalRatio = img.naturalWidth / img.naturalHeight;
            const renderedRatio = rect.width / rect.height;
            if (style.objectFit !== 'contain' && Math.abs(naturalRatio - renderedRatio) > 0.02) errors.push('Cropped image: ' + img.src);
            if (img.closest('.util-photo-gallery') && rect.right > innerWidth + 1) errors.push('Gallery overflow');
          }
          closeUtilArticleModal();
        }
        return errors;
      });
      assert.deepEqual(errors, [], 'Photos at ' + width + 'px');
      await page.hover('.article-card-thumb-wrap');
      assert.equal(await page.$eval('.article-card-thumb-wrap img', img => getComputedStyle(img).transform), 'none');
      console.log('PASS full photos and galleries at ' + width + 'px');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
