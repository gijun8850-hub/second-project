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
    '.onboarding-scene-image',
    '.onboarding-header',
    '.onboarding-photo-card',
    '.onboarding-graphic-panel',
    '.onboarding-map-card',
    '.onboarding-flow-steps',
    'backdrop-filter: blur',
    '.onboarding-chip-row',
    '.onboarding-chip-button',
    '.onboarding-login-note',
    '.onboarding-login-link',
    '.login-form',
    '.login-card',
    '.pot-card__cta',
    'linear-gradient(180deg, rgba(251, 244, 255, 0.34) 0%, rgba(251, 244, 255, 0.16) 30%, rgba(245, 233, 251, 0.38) 62%, rgba(242, 228, 249, 0.74) 100%)',
    'text-overflow: ellipsis',
    'object-position: center bottom',
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
