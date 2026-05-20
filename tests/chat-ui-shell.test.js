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

test('app shell exposes the student-first onboarding copy and IME-friendly search handling', () => {
  [
    '근처 팟, 바로 합류',
    '캠퍼스 N빵을 더 쉽고 빠르게',
    'student-chip-row',
    'onboarding-hero-visual',
    'images/onboarding-campus.png',
    'home-hero-note',
    'isSearchComposing',
    'compositionstart',
    'compositionend',
    'renderHome({ animate: false })'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});
