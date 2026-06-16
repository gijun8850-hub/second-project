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

function openAuthEntry(harness) {
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
}

function openSignupEntry(harness) {
  openAuthEntry(harness);
  harness.dispatchClick({
    '[data-auth-tab]': {
      dataset: { authTab: 'signup' }
    }
  });

  assert.match(harness.app.innerHTML, /signup-form/);
}

function submitSignup(harness, overrides = {}) {
  return harness.dispatchSubmit({
    id: 'signup-form',
    __formData: {
      email: 'student@gachon.ac.kr',
      password: 'secret123',
      passwordConfirm: 'secret123',
      ...overrides
    }
  });
}

function reachVerification(harness) {
  openSignupEntry(harness);
  const prevented = submitSignup(harness);
  assert.equal(prevented, true);
  assert.match(harness.app.innerHTML, /data-verify-method="naver_student_id"/);
  return harness;
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
  assert.doesNotMatch(appSource, /로그인 후 계속할 수 있어요/);
  assert.doesNotMatch(appSource, /School verification is available in the next step/);
  assert.doesNotMatch(appSource, /onboarding-chip-block/);
  assert.doesNotMatch(appSource, /onboarding-login-link/);
});

test('auth shell exposes login signup tabs, realistic account controls, and trust reminders', () => {
  [
    'renderAuth',
    'auth-tabs',
    'data-auth-tab',
    'signup-form',
    'signup-email',
    'signup-password-confirm',
    'remember-login',
    'find-account-link',
    '카카오로 시작하기',
    '검증된 캠퍼스 메이트',
    '에스크로 안전 정산',
    '네이버페이 포인트 적립'
  ].forEach((token) => {
    assert.ok(appSource.includes(token), `Missing token: ${token}`);
  });
});

test('verification flow source exposes dedicated route tokens and simulated options', () => {
  [
    'function renderVerification',
    "case 'verification'",
    "setRoute('verification')",
    'data-verify-method="naver_student_id"',
    'data-verify-method="school_email"',
    'data-skip-verification'
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

test('runtime harness surfaces trust reminders on auth entry', () => {
  const harness = createHarness();

  openAuthEntry(harness);

  [
    '검증된 캠퍼스 메이트',
    '에스크로 안전 정산',
    '네이버페이 포인트 적립'
  ].forEach((copy) => {
    assert.match(harness.app.innerHTML, new RegExp(copy));
  });
});

test('runtime harness keeps mismatched signup inside the SPA auth flow', () => {
  const harness = createHarness();

  openSignupEntry(harness);
  const mismatchPrevented = submitSignup(harness, {
    passwordConfirm: 'different123'
  });

  assert.equal(mismatchPrevented, true);
  assert.match(harness.app.innerHTML, /auth-tabs/);
  assert.match(harness.app.innerHTML, /signup-form/);
  assert.match(harness.toast.textContent, /비밀번호/);
  assert.doesNotMatch(harness.toast.textContent, /학생 인증/);
});

test('runtime harness routes successful signup into the verification screen', () => {
  const harness = createHarness();

  reachVerification(harness);

  assert.doesNotMatch(harness.app.innerHTML, /auth-tabs/);
  assert.match(harness.app.innerHTML, /data-verify-method="naver_student_id"/);
  assert.match(harness.app.innerHTML, /data-verify-method="school_email"/);
  assert.match(harness.app.innerHTML, /data-skip-verification/);
});

test('runtime harness completes simulated Naver student ID verification and routes home', () => {
  const harness = createHarness();

  reachVerification(harness);
  harness.dispatchClick({
    '[data-verify-method]': {
      dataset: { verifyMethod: 'naver_student_id' }
    }
  });

  assert.match(harness.app.innerHTML, /hub-highlight/);
  assert.match(harness.toast.textContent, /네이버 학생증/);
});

test('runtime harness completes simulated school email verification and routes home', () => {
  const harness = createHarness();

  reachVerification(harness);
  harness.dispatchClick({
    '[data-verify-method]': {
      dataset: { verifyMethod: 'school_email' }
    }
  });

  assert.match(harness.app.innerHTML, /hub-highlight/);
  assert.match(harness.toast.textContent, /학교 이메일/);
});

test('runtime harness allows skipping optional student verification and routes home', () => {
  const harness = createHarness();

  reachVerification(harness);
  harness.dispatchClick({
    '[data-skip-verification]': {
      dataset: {}
    }
  });

  assert.match(harness.app.innerHTML, /hub-highlight/);
  assert.match(harness.toast.textContent, /나중에/);
});
