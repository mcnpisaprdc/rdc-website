const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the page handlers with a minimal DOM, without external requests.
for (const file of ['utilization.js', 'utilization.min.js']) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', value: '', style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}, querySelectorAll() { return []; }
    });
    return elements.get(id);
  };
  const context = {
    document: { getElementById: element, addEventListener() {}, querySelectorAll() { return []; } },
    window: { location: { hash: '', search: '' }, addEventListener() {} },
    history: { replaceState() {} }, URLSearchParams, setTimeout() {}, console
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'pages', file), 'utf8'), context);
  const run = code => vm.runInContext(code, context);
  run("filterUtilizationWing('isap'); handleUtilSearch('Jeline Flor');");
  assert.ok(run('getFilteredUtilizationArticles().length') > 0, 'Search finds facilitator names');
  run("handleUtilSearch('no-such-article-xyz');");
  assert.ok(!element('utilizationArticlesGrid').innerHTML.includes('Documentation In-Process'));
  const recovery = element('utilizationArticlesGrid').innerHTML.match(/onclick="([^"]*setMainCourseFilter\('criminology'\)[^"]*)"/);
  assert.ok(recovery, 'Published article recovery button exists');
  run(recovery[1]);
  assert.ok(run('getFilteredUtilizationArticles().length') > 0, 'Recovery clears stale filters');
  run("handleUtilPillarFilter('no-matching-pillar');");
  assert.ok(element('utilizationArticlesGrid').innerHTML.includes('No Utilization Articles Matching Filters'));
  run("handleUtilSearch('no-such-article-xyz'); window.location.hash = '#' + getAllUtilizationArticles()[0].id; checkUrlHashAndOpenArticle();");
  assert.ok(run('getFilteredUtilizationArticles().length') > 0, 'Direct links clear conflicting filters');
  assert.equal(element('utilSearchInput').value, '');
  assert.equal(element('utilPillarFilterSelect').value, 'all');
  console.log('PASS utilization search, empty states, recovery, and direct links: ' + file);
}
