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
    '\uac19\uc774 N\ube75\ud560 \uc0ac\ub78c \uad6c\ud574\uc694',
    '\uadfc\ucc98 \ub300\ud559\uc0dd\uacfc \uc27d\uace0 \ube60\ub974\uac8c',
    '\ubaa8\uc9d1\ubd80\ud130 \uc815\uc0b0\uae4c\uc9c0 \ud55c \ubc88\uc5d0',
    '\uc2dc\uc791\ud558\uae30'
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
    '移댁뭅?ㅻ줈 ?쒖옉?섍린'
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
    "梨꾪똿?쇰줈 ?대룞",
    "李몄뿬?섍린"
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});
