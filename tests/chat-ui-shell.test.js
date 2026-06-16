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

test('onboarding exposes three guided pages and a final start CTA', () => {
  [
    'onboarding-pager',
    'data-onboarding-next',
    'data-onboarding-page',
    '근처 대학생과 쉽고 빠르게'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
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
    '카카오로 시작하기'
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
    "채팅으로 이동",
    "참여하기"
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});
