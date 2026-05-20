const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('potmate_demo.html is a self-contained browser demo for the balanced PotMate flow', () => {
  const html = fs.readFileSync('potmate_demo.html', 'utf8');

  [
    '<main id="app"',
    '<style>',
    '--color-main: #AA01E7',
    'window.PotMateSeed',
    'PotMateCore',
    'radius-filter',
    'closing-soon-section',
    'trust-badge',
    'settlement-stage',
    'wallet-quick-charge',
    'coupon-card'
  ].forEach((token) => {
    assert.ok(html.includes(token), `Missing token: ${token}`);
  });

  assert.doesNotMatch(html, /<link\b/i);
  assert.doesNotMatch(html, /src=["']\.\/js\//i);
  assert.doesNotMatch(html, /href=["']\.\/css\//i);
});
