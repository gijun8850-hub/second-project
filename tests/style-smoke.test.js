const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('css/style.css', 'utf8');

test('style.css defines the PotMate palette, glossy cards, and richer balanced-demo components', () => {
  [
    '--color-main: #AA01E7',
    '--color-soft: #F8E7FE',
    '.mobile-shell',
    '.onboarding-header',
    '.onboarding-photo-card',
    '.onboarding-photo',
    '.onboarding-action-card',
    '.onboarding-chip-row',
    '.onboarding-login-note',
    '.hub-highlight',
    '.filter-row',
    '.spotlight-grid',
    '.trust-badge',
    '.timeline-card',
    '.stage-track',
    '.wallet-quick-charge',
    '.coupon-card',
    '.screen-enter',
    '.message-row',
    '.message-profile',
    '.host-badge',
    '.bottom-nav',
    '.toast',
    'white-space: nowrap',
    'font-style: normal',
    '@media (min-width: 720px)',
    '@media (max-width: 420px)'
  ].forEach((token) => {
    assert.ok(css.includes(token), `Missing token: ${token}`);
  });
});
