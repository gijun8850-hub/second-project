const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

test('index.html exposes the PotMate mobile webapp mount points', () => {
  [
    'app',
    'toast'
  ].forEach((id) => {
    assert.match(html, new RegExp(`id="${id}"`));
  });

  assert.match(html, /팟메이트\(PotMate\)/);
  assert.match(html, /src="\.\/js\/potmate-data\.js"/);
  assert.match(html, /src="\.\/js\/potmate-core\.js"/);
  assert.match(html, /src="\.\/js\/app\.js"/);
  assert.doesNotMatch(html, /planner\.js/);
});
