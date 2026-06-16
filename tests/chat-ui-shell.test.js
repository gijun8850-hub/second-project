const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync('js/app.js', 'utf8');
const seedSource = fs.readFileSync('js/potmate-data.js', 'utf8');

function loadSeed() {
  const sandbox = { window: {} };
  vm.runInNewContext(seedSource, sandbox);
  return sandbox.window.PotMateSeed;
}

test('app shell exposes home hub and control tokens', () => {
  [
    'radius-filter',
    'sort-filter',
    'hub-highlight',
    'closing-soon-section',
    'category-spotlight'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});

test('chat renderer keeps profile rows, host badge, own-message alignment, and settlement tokens', () => {
  [
    'message-row',
    'message-profile',
    'message-body',
    'message-name',
    'host-badge',
    'is-own',
    'settlement-stage',
    'trust-badge',
    'timeline-card',
    'wallet-quick-charge',
    'coupon-card'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});

test('onboarding exposes pager shell tokens and approved seeded titles', () => {
  [
    'onboarding-pager',
    'data-onboarding-next',
    'data-onboarding-page',
    '\uc2dc\uc791\ud558\uae30'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing app token: ${token}`);
  });

  const seed = loadSeed();
  assert.deepEqual(
    Array.from(seed.onboardingSlides, (slide) => slide.title),
    [
      '\uac19\uc774 N\ube75\ud560 \uc0ac\ub78c \uad6c\ud574\uc694',
      '\uadfc\ucc98 \ub300\ud559\uc0dd\uacfc \uc27d\uace0 \ube60\ub974\uac8c',
      '\ubaa8\uc9d1\ubd80\ud130 \uc815\uc0b0\uae4c\uc9c0 \ud55c \ubc88\uc5d0'
    ]
  );
});

test('auth shell exposes login signup tabs and realistic account controls', () => {
  [
    'renderAuth',
    'auth-tabs',
    'data-auth-tab',
    'signup-form',
    'signup-email',
    'signup-password-confirm',
    'remember-login',
    'find-account-link',
    '\uce74\uce74\uc624\ub85c \uc2dc\uc791\ud558\uae30'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});

test('home search keeps IME-friendly handling', () => {
  [
    'isSearchComposing',
    'compositionstart',
    'compositionend',
    'updateHomeSearchResults'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});

test('home cards expose compact CTA sizing tokens for join and chat actions', () => {
  [
    'pot-card__cta',
    '\ucc44\ud305\uc73c\ub85c \uc774\ub3d9',
    '\ucc38\uc5ec\ud558\uae30'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});
