const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const appSource = fs.readFileSync('js/app.js', 'utf8');
const seedSource = fs.readFileSync('js/potmate-data.js', 'utf8');

function loadSeed() {
  const sandbox = { window: {} };
  vm.runInNewContext(seedSource, sandbox);
  return sandbox.window.PotMateSeed;
}

function createHarness() {
  const listeners = new Map();
  const app = {
    innerHTML: '',
    addEventListener(type, handler) {
      const current = listeners.get(type) || [];
      current.push(handler);
      listeners.set(type, current);
    }
  };
  const toast = {
    textContent: '',
    classList: {
      add() {},
      remove() {}
    }
  };
  const document = {
    querySelector(selector) {
      if (selector === '#app') return app;
      if (selector === '#toast') return toast;
      return null;
    }
  };
  const window = {
    PotMateSeed: loadSeed(),
    PotMateCore: {
      formatWon(amount) {
        return `${amount}`;
      },
      buildHomeSections() {
        return {
          categoryStats: [],
          recommended: [],
          visible: [],
          closingSoon: [],
          categorySpotlights: []
        };
      },
      canJoinPot() {
        return { ok: true };
      },
      joinPot(state) {
        return state;
      },
      chargePoints(state) {
        return state;
      },
      requestSettlement(state) {
        return state;
      },
      sendReminder() {
        return '';
      },
      sendChatMessage(state) {
        return state;
      },
      updateRecruitmentStatus(state) {
        return state;
      },
      markParticipantPaid(state) {
        return state;
      },
      createPot(input) {
        return input;
      }
    },
    clearTimeout() {},
    setTimeout() {
      return 0;
    }
  };

  function FormData(form) {
    this.get = (name) => (form.__formData && name in form.__formData ? form.__formData[name] : '');
    this.entries = function* entries() {
      const source = form.__formData || {};
      for (const key of Object.keys(source)) {
        yield [key, source[key]];
      }
    };
  }

  const sandbox = {
    window,
    document,
    FormData,
    console,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout
  };
  vm.runInNewContext(appSource, sandbox);

  function closestMapTarget(map) {
    return {
      closest(selector) {
        return map[selector] || null;
      }
    };
  }

  function dispatch(type, event) {
    for (const handler of listeners.get(type) || []) {
      handler(event);
    }
  }

  return {
    app,
    toast,
    dispatchClick(map) {
      dispatch('click', {
        target: closestMapTarget(map),
        stopPropagation() {},
        preventDefault() {}
      });
    },
    dispatchSubmit(target) {
      let prevented = false;
      dispatch('submit', {
        target,
        preventDefault() {
          prevented = true;
        }
      });
      return prevented;
    }
  };
}

test('app shell exposes home hub and control tokens', () => {
  [
    'radius-filter',
    'sort-filter',
    'hub-highlight',
    'closing-soon-section',
    'category-spotlight'
  ].forEach((token) => {
    assert.ok(appSource.includes(token), `Missing token: ${token}`);
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
    assert.ok(appSource.includes(token), `Missing token: ${token}`);
  });
});

test('onboarding exposes pager shell tokens and approved seeded titles', () => {
  [
    'onboarding-pager',
    'data-onboarding-next',
    'data-onboarding-page',
    '시작하기'
  ].forEach((token) => {
    assert.ok(appSource.includes(token), `Missing app token: ${token}`);
  });

  const seed = loadSeed();
  assert.deepEqual(
    Array.from(seed.onboardingSlides, (slide) => slide.title),
    [
      '같이 N빵할 사람 구해요',
      '근처 대학생과 쉽고 빠르게',
      '모집부터 정산까지 한 번에'
    ]
  );
});

test('entry flow source keeps one onboarding renderer and SPA signup submit handling', () => {
  assert.equal((appSource.match(/function renderOnboarding\(/g) || []).length, 1);
  assert.equal((appSource.match(/function renderLogin\(/g) || []).length, 1);
  assert.match(appSource, /event\.target\.id === 'signup-form'/);
  assert.match(appSource, /password !== passwordConfirm/);
  assert.match(appSource, /passwordConfirm/);
  assert.match(appSource, /event\.preventDefault\(\);/);
  assert.match(appSource, /showToast\(/);
  assert.doesNotMatch(appSource, /School verification is available in the next step/);
  assert.doesNotMatch(appSource, /onboarding-chip-block/);
  assert.doesNotMatch(appSource, /onboarding-login-link/);
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
    assert.ok(appSource.includes(token), `Missing token: ${token}`);
  });
});

test('home search keeps IME-friendly handling', () => {
  [
    'isSearchComposing',
    'compositionstart',
    'compositionend',
    'updateHomeSearchResults'
  ].forEach((token) => {
    assert.ok(appSource.includes(token), `Missing token: ${token}`);
  });
});

test('home cards expose compact CTA sizing tokens for join and chat actions', () => {
  [
    'pot-card__cta',
    '채팅으로 이동',
    '참여하기'
  ].forEach((token) => {
    assert.ok(appSource.includes(token), `Missing token: ${token}`);
  });
});

test('runtime harness keeps onboarding and signup flows inside the SPA', () => {
  const harness = createHarness();

  assert.match(harness.app.innerHTML, /onboarding-pager/);

  harness.dispatchClick({
    '[data-onboarding-page]': {
      dataset: { onboardingPage: '2' }
    }
  });
  harness.dispatchClick({
    '[data-route]': {
      dataset: { route: 'auth' }
    }
  });

  assert.match(harness.app.innerHTML, /auth-tabs/);
  assert.match(harness.app.innerHTML, /signup-form|login-form/);

  const mismatchPrevented = harness.dispatchSubmit({
    id: 'signup-form',
    __formData: {
      email: 'student@gachon.ac.kr',
      password: 'secret123',
      passwordConfirm: 'different123'
    }
  });

  assert.equal(mismatchPrevented, true);
  assert.match(harness.app.innerHTML, /auth-tabs/);
  assert.match(harness.app.innerHTML, /signup-form/);
  assert.match(harness.toast.textContent, /비밀번호/);
  assert.doesNotMatch(harness.toast.textContent, /로그인 후 계속/);

  const successPrevented = harness.dispatchSubmit({
    id: 'signup-form',
    __formData: {
      email: 'student@gachon.ac.kr',
      password: 'secret123',
      passwordConfirm: 'secret123'
    }
  });

  assert.equal(successPrevented, true);
  assert.match(harness.app.innerHTML, /auth-tabs/);
  assert.match(harness.app.innerHTML, /login-form/);
  assert.match(harness.toast.textContent, /로그인 후 계속/);
  assert.doesNotMatch(harness.toast.textContent, /verification/i);
});
