const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('css/style.css', 'utf8');

test('style.css defines the PotMate palette, glossy cards, and richer balanced-demo components', () => {
  [
    '--color-main: #AA01E7',
    '--color-soft: #F8E7FE',
    '.mobile-shell',
    '.onboarding-screen--scene',
    '.onboarding-scene-layer',
    '.onboarding-header',
    '.onboarding-photo-card',
    '.onboarding-photo',
    'backdrop-filter: blur',
    '.onboarding-chip-row',
    '.onboarding-chip-button',
    '.onboarding-login-note',
    '.onboarding-login-link',
    '.login-form',
    '.login-card',
    '.pot-card__cta',
    'linear-gradient(180deg, rgba(251, 244, 255, 0.52) 0%, rgba(251, 244, 255, 0.52) 100%)',
    'text-overflow: ellipsis',
    'background-size: 112% auto',
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
