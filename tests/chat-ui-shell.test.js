const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('js/app.js', 'utf8');

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

test('onboarding exposes scene cards, category shortcuts, login flow, and IME-friendly search handling', () => {
  [
    'onboarding-screen--scene',
    'onboarding-scene-layer',
    'onboarding-header',
    'onboarding-photo-card',
    'onboarding-photo',
    'onboarding-action-card',
    'data-onboarding-category',
    'onboarding-login-link',
    'renderLogin',
    'login-form',
    'login-id',
    'login-password',
    'isSearchComposing',
    'compositionstart',
    'compositionend',
    'updateHomeSearchResults'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});
