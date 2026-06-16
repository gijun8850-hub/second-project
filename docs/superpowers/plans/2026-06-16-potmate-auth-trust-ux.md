# PotMate Auth And Trust UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the current PotMate demo with a 3-page onboarding flow, tabbed login/signup entry, optional student verification, and stronger escrow/trust UX without introducing any real external authentication or payment integrations.

**Architecture:** Keep the existing static `seed -> core helpers -> render/controller -> CSS -> bundle` structure. Extend the seed state and pure helpers just enough to support onboarding progress, auth mode, verification status, and the richer settlement stepper, then layer the new routes and trust surfaces into the current `app.js` flow instead of rebuilding the app shell.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, Node.js `node:test`, GitHub Pages-friendly bundling via `scripts/build-potmate-demo.js`

---

## File Map

- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\js\potmate-data.js`
  - seed onboarding page content
  - seed auth and verification defaults
  - seed trust-highlight copy used across the demo
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\js\potmate-core.js`
  - keep pure helpers for settlement progress and verification-aware trust summaries
  - evolve the settlement stepper model from 3 steps to the approved 4-step escrow flow
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\js\app.js`
  - replace single-screen onboarding with a 3-page pager
  - replace the login-only screen with a tabbed auth screen
  - add the student verification screen and route transitions
  - add trust strips and escrow badges to existing screens
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\css\style.css`
  - add onboarding pager, auth tabs, verification cards, trust strips, escrow badges, and 4-step settlement visuals
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\chat-ui-shell.test.js`
  - lock in new app shell tokens for onboarding, auth, verification, and trust UI
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\potmate-core.test.js`
  - lock in the updated settlement progress contract and verification/trust helpers
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\style-smoke.test.js`
  - lock in style tokens for pager, auth tabs, verification cards, trust strips, and stepper
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\potmate-demo-bundle.test.js`
  - verify the self-contained bundle exposes the new onboarding/auth/verification flow
- Regenerate: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\potmate_demo.html`

### Task 1: Extend seed state and pure trust/settlement helpers

**Files:**
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\js\potmate-data.js`
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\js\potmate-core.js`
- Test: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\potmate-core.test.js`

- [ ] **Step 1: Write the failing tests for the new settlement stepper and verification summary helpers**

```js
test('buildSettlementStages exposes the four-step escrow flow', () => {
  const held = buildSettlementStages('funds_held');
  assert.deepEqual(held.map((stage) => stage.label), [
    '참여자 결제',
    '금액 보관',
    '서비스 이용 완료',
    '방장 정산 완료'
  ]);
  assert.deepEqual(held.map((stage) => stage.state), [
    'done',
    'current',
    'pending',
    'pending'
  ]);
});

test('requestSettlement moves the pot into escrow-held state', () => {
  const state = {
    user: { id: 'me', name: '민아' },
    pots: [{
      ...pots[1],
      escrowStage: 'participant_payment',
      host: { id: 'host-2', name: '민호', avatar: '민' },
      participants: [
        { id: 'host-2', name: '민호', avatar: '민', paid: true },
        { id: 'me', name: '민아', avatar: '민', paid: false },
        { id: 'mate-3', name: '지윤', avatar: '지', paid: false }
      ]
    }],
    chats: { 'pot-taxi-near': { potId: 'pot-taxi-near', messages: [] } },
    settlements: [],
    payments: []
  };

  const next = requestSettlement(state, 'pot-taxi-near', 27000);
  assert.equal(next.pots[0].escrowStage, 'funds_held');
});

test('buildVerificationSummary exposes the approved trust copy and status', () => {
  assert.deepEqual(
    buildVerificationSummary({
      status: 'verified',
      method: 'naver_student_id',
      skipped: false
    }),
    {
      badge: '네이버 학생증 인증 완료',
      headline: '검증된 캠퍼스 메이트',
      helper: '같은 학교 학생만 더 안전하게 연결할 수 있어요.'
    }
  );
});
```

- [ ] **Step 2: Run the targeted core test file and verify it fails for the missing 4-step and verification behavior**

Run: `node --test tests\potmate-core.test.js`

Expected: FAIL because `buildSettlementStages` still returns the old 3-step model and `buildVerificationSummary` does not exist yet.

- [ ] **Step 3: Add the seed state and minimal pure helpers in `potmate-data.js` and `potmate-core.js`**

```js
// js/potmate-data.js
  hasSeenOnboarding: false,
  onboardingIndex: 0,
  authMode: 'login',
  verification: {
    status: 'unverified',
    method: null,
    skipped: false
  },
  onboardingSlides: [
    {
      id: 'share',
      title: '같이 N빵할 사람 구해요',
      description: '배달, 택시, 구독까지 캠퍼스 메이트와 함께 나누고 더 가볍게 이용하세요.',
      graphic: 'categories'
    },
    {
      id: 'nearby',
      title: '근처 대학생과 쉽고 빠르게',
      description: '위치 기반 매칭으로 내 주변 대학생들과 안전하게 연결됩니다.',
      graphic: 'campus-map'
    },
    {
      id: 'settlement',
      title: '모집부터 정산까지 한 번에',
      description: '채팅, 정산, 네이버페이 결제까지 앱 안에서 모두 해결하세요.',
      graphic: 'recruit-chat-pay'
    }
  ],
  trustHighlights: [
    '검증된 캠퍼스 메이트',
    '에스크로 안전 정산',
    '네이버페이 포인트 적립'
  ],
```

```js
// js/potmate-core.js
function buildVerificationSummary(verification) {
  if (verification.status === 'verified' && verification.method === 'naver_student_id') {
    return {
      badge: '네이버 학생증 인증 완료',
      headline: '검증된 캠퍼스 메이트',
      helper: '같은 학교 학생만 더 안전하게 연결할 수 있어요.'
    };
  }

  if (verification.status === 'verified' && verification.method === 'school_email') {
    return {
      badge: '학교 이메일 인증 완료',
      headline: '검증된 캠퍼스 메이트',
      helper: '학교 이메일 인증으로 더 신뢰 있게 참여할 수 있어요.'
    };
  }

  return {
    badge: '대학생 인증 전',
    headline: '같은 학교 학생만 참여할 수 있어요',
    helper: '네이버 학생증 인증으로 안전한 N빵을 시작하세요.'
  };
}

function buildSettlementStages(currentStage) {
  const stages = [
    { key: 'participant_payment', label: '참여자 결제' },
    { key: 'funds_held', label: '금액 보관' },
    { key: 'service_completed', label: '서비스 이용 완료' },
    { key: 'host_settled', label: '방장 정산 완료' }
  ];
  const activeIndex = Math.max(0, stages.findIndex((stage) => stage.key === currentStage));

  return stages.map((stage, index) => ({
    ...stage,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'pending'
  }));
}
```

- [ ] **Step 4: Re-run the targeted core test file and verify the new settlement and verification expectations pass**

Run: `node --test tests\potmate-core.test.js`

Expected: PASS for the new verification summary and 4-step settlement behavior.

- [ ] **Step 5: Commit the seed-state and core-helper changes**

```bash
git add js/potmate-data.js js/potmate-core.js tests/potmate-core.test.js
git commit -m "feat: add auth trust seed state and escrow helpers"
```

### Task 2: Replace the current entry flow with a 3-page onboarding and tabbed auth screen

**Files:**
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\js\app.js`
- Test: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\chat-ui-shell.test.js`

- [ ] **Step 1: Write the failing shell tests for the onboarding pager and auth tabs**

```js
test('onboarding exposes three guided pages and a final start CTA', () => {
  [
    'onboarding-pager',
    'data-onboarding-next',
    'data-onboarding-page',
    '같이 N빵할 사람 구해요',
    '근처 대학생과 쉽고 빠르게',
    '모집부터 정산까지 한 번에',
    '시작하기'
  ].forEach((token) => assert.ok(app.includes(token), `Missing token: ${token}`));
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
  ].forEach((token) => assert.ok(app.includes(token), `Missing token: ${token}`));
});
```

- [ ] **Step 2: Run the shell test file and verify it fails for missing onboarding/auth tokens**

Run: `node --test tests\chat-ui-shell.test.js`

Expected: FAIL because the code still exposes the single-page onboarding and login-only screen.

- [ ] **Step 3: Replace `renderOnboarding` and `renderLogin` with the approved multi-step onboarding and tabbed auth flow**

```js
function renderOnboarding() {
  const slide = state.onboardingSlides[state.onboardingIndex];
  const isLast = state.onboardingIndex === state.onboardingSlides.length - 1;

  app.innerHTML = `
    <section class="onboarding-screen screen-enter">
      <div class="onboarding-pager">
        ${state.onboardingSlides.map((item, index) => `
          <button
            type="button"
            class="onboarding-dot ${index === state.onboardingIndex ? 'is-active' : ''}"
            data-onboarding-page="${index}"
            aria-label="${index + 1}번 온보딩"
          ></button>
        `).join('')}
      </div>
      <div class="onboarding-graphic onboarding-graphic--${slide.graphic}"></div>
      <div class="onboarding-copy">
        <h1>${slide.title}</h1>
        <p>${slide.description}</p>
      </div>
      <div class="onboarding-actions">
        ${!isLast ? '<button type="button" class="secondary-button" data-onboarding-next="next">다음</button>' : ''}
        ${isLast ? '<button type="button" class="gradient-button full-button" data-route="auth">시작하기</button>' : ''}
      </div>
    </section>
  `;
}

function renderAuth() {
  const isLogin = state.authMode === 'login';
  app.innerHTML = `
    <section class="screen screen-enter auth-screen">
      ${backButton('onboarding')}
      <div class="auth-tabs">
        <button type="button" class="${isLogin ? 'is-active' : ''}" data-auth-tab="login">로그인</button>
        <button type="button" class="${!isLogin ? 'is-active' : ''}" data-auth-tab="signup">회원가입</button>
      </div>
      ${isLogin ? renderLoginPanel() : renderSignupPanel()}
    </section>
  `;
}
```

- [ ] **Step 4: Add the onboarding and auth interaction handlers**

```js
if (event.target.closest('[data-onboarding-next]')) {
  state.onboardingIndex = Math.min(state.onboardingIndex + 1, state.onboardingSlides.length - 1);
  render();
  return;
}

const onboardingPageButton = event.target.closest('[data-onboarding-page]');
if (onboardingPageButton) {
  state.onboardingIndex = Number(onboardingPageButton.dataset.onboardingPage);
  render();
  return;
}

const authTabButton = event.target.closest('[data-auth-tab]');
if (authTabButton) {
  state.authMode = authTabButton.dataset.authTab;
  render();
  return;
}
```

- [ ] **Step 5: Re-run the shell test file and verify the onboarding/auth contract passes**

Run: `node --test tests\chat-ui-shell.test.js`

Expected: PASS for the new onboarding pager and auth shell tokens.

- [ ] **Step 6: Commit the onboarding and auth shell changes**

```bash
git add js/app.js tests/chat-ui-shell.test.js
git commit -m "feat: add onboarding pager and tabbed auth entry"
```

### Task 3: Add the separate student verification screen and optional skip flow

**Files:**
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\js\app.js`
- Test: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\chat-ui-shell.test.js`

- [ ] **Step 1: Write the failing shell tests for the verification route and trust reminders**

```js
test('verification screen exposes the primary student ID option and skip path', () => {
  [
    'renderVerification',
    'verification-screen',
    'verification-card--primary',
    'data-verify-method="naver_student_id"',
    'data-verify-method="school_email"',
    'data-skip-verification',
    '검증된 캠퍼스 메이트로 시작하세요'
  ].forEach((token) => assert.ok(app.includes(token), `Missing token: ${token}`));
});

test('app shell exposes trust reminder surfaces after auth entry', () => {
  [
    'verification-reminder',
    '검증된 캠퍼스 메이트',
    '에스크로 안전 정산',
    '네이버페이 포인트 적립'
  ].forEach((token) => assert.ok(app.includes(token), `Missing token: ${token}`));
});
```

- [ ] **Step 2: Run the shell tests and verify they fail because verification UI is missing**

Run: `node --test tests\chat-ui-shell.test.js`

Expected: FAIL because there is no dedicated verification route or verification reminder surface yet.

- [ ] **Step 3: Implement the signup submit route, verification screen, and skip behavior**

```js
function renderVerification() {
  const summary = core.buildVerificationSummary(state.verification);
  app.innerHTML = `
    <section class="screen screen-enter verification-screen">
      ${backButton('auth')}
      <div class="page-title">
        <h1>검증된 캠퍼스 메이트로 시작하세요</h1>
        <p>같은 학교 학생만 더 안전하게 연결할 수 있어요.</p>
      </div>
      <article class="glass-card verification-card verification-card--primary">
        <span class="status-pill">${summary.badge}</span>
        <strong>네이버 학생증 인증</strong>
        <p>네이버 학생증으로 빠르게 인증하고 검증된 캠퍼스 메이트 배지를 받으세요.</p>
        <button type="button" class="gradient-button full-button" data-verify-method="naver_student_id">학생증 인증하기</button>
      </article>
      <article class="glass-card verification-card">
        <strong>학교 이메일 인증</strong>
        <p>학교 이메일로 인증 링크를 받아 안전하게 참여할 수 있어요.</p>
        <button type="button" class="secondary-button full-button" data-verify-method="school_email">이메일로 인증하기</button>
      </article>
      <button type="button" class="ghost-button full-button" data-skip-verification="true">나중에 하기</button>
    </section>
  `;
}

if (event.target.id === 'signup-form') {
  event.preventDefault();
  state.authMode = 'signup';
  setRoute('verification');
  return;
}
```

- [ ] **Step 4: Implement the simulated verification state transitions**

```js
const verifyButton = event.target.closest('[data-verify-method]');
if (verifyButton) {
  state.verification = {
    status: 'verified',
    method: verifyButton.dataset.verifyMethod,
    skipped: false
  };
  showToast('대학생 인증이 완료됐어요.');
  setRoute('home');
  return;
}

if (event.target.closest('[data-skip-verification]')) {
  state.verification = {
    ...state.verification,
    skipped: true
  };
  showToast('지금은 둘러보기로 이동할게요. 참여 전에 다시 인증할 수 있어요.');
  setRoute('home');
  return;
}
```

- [ ] **Step 5: Add the verification reminder block to the app surfaces that need ambient trust**

```js
function renderVerificationReminder() {
  if (state.verification.status === 'verified') return '';

  return `
    <div class="verification-reminder trust-strip">
      <strong>검증된 캠퍼스 메이트</strong>
      <p>같은 학교 학생만 더 안전하게 참여할 수 있어요. 네이버 학생증 인증을 완료해 보세요.</p>
      <button type="button" class="ghost-button" data-route="verification">지금 인증하기</button>
    </div>
  `;
}
```

- [ ] **Step 6: Re-run the shell tests and verify the verification/trust surfaces pass**

Run: `node --test tests\chat-ui-shell.test.js`

Expected: PASS for the dedicated verification route and reminder tokens.

- [ ] **Step 7: Commit the verification route and trust reminder changes**

```bash
git add js/app.js tests/chat-ui-shell.test.js
git commit -m "feat: add optional student verification flow"
```

### Task 4: Strengthen settlement trust UX and the 4-step escrow progress display

**Files:**
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\js\potmate-core.js`
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\js\app.js`
- Test: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\potmate-core.test.js`
- Test: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\chat-ui-shell.test.js`

- [ ] **Step 1: Write the failing tests for escrow UI tokens and host progression actions**

```js
test('settlement shell exposes escrow trust badges and 4-step progress tokens', () => {
  [
    'escrow-badge',
    'escrow-helper',
    'settlement-stepper',
    '참여자 결제',
    '금액 보관',
    '서비스 이용 완료',
    '방장 정산 완료'
  ].forEach((token) => assert.ok(app.includes(token), `Missing token: ${token}`));
});

test('buildSettlementStages marks the host_settled state as fully complete', () => {
  const stages = buildSettlementStages('host_settled');
  assert.deepEqual(stages.map((stage) => stage.state), [
    'done',
    'done',
    'done',
    'current'
  ]);
});
```

- [ ] **Step 2: Run the targeted tests and verify they fail because the settlement UI still uses the old model**

Run: `node --test tests\potmate-core.test.js tests\chat-ui-shell.test.js`

Expected: FAIL because the UI does not render escrow badges or the 4-step labels yet.

- [ ] **Step 3: Render the escrow badge and 4-step progress block at the top of settlement**

```js
function renderEscrowNotice() {
  return `
    <div class="escrow-badge-card">
      <span class="status-pill escrow-badge">안전결제</span>
      <p class="escrow-helper">에스크로 기반으로 정산금이 보호되고 있어요.</p>
      <span class="escrow-reward">네이버페이 포인트 적립 예정</span>
    </div>
  `;
}

function renderSettlementStepper(pot) {
  const stages = core.buildSettlementStages(pot.escrowStage || 'participant_payment');
  return `
    <div class="settlement-stepper">
      ${stages.map((stage) => `
        <div class="settlement-step settlement-step--${stage.state}">
          <span>${stage.label}</span>
        </div>
      `).join('')}
    </div>
  `;
}
```

- [ ] **Step 4: Add the host-side state transitions for service completion and settlement release**

```js
function updateEscrowStage(state, potId, escrowStage) {
  const next = clone(state);
  const pot = next.pots.find((item) => item.id === potId);
  if (!pot) return next;
  pot.escrowStage = escrowStage;
  if (escrowStage === 'host_settled') {
    pot.settlementStage = '정산 완료';
  }
  return next;
}

const serviceDoneButton = event.target.closest('[data-service-complete]');
if (serviceDoneButton) {
  state = core.updateEscrowStage(state, serviceDoneButton.dataset.serviceComplete, 'service_completed');
  render();
  return;
}

const settleDoneButton = event.target.closest('[data-finalize-settlement]');
if (settleDoneButton) {
  state = core.updateEscrowStage(state, settleDoneButton.dataset.finalizeSettlement, 'host_settled');
  render();
  return;
}
```

- [ ] **Step 5: Add escrow trust surfaces to detail, chat, and My Payments**

```js
function renderEscrowInlineNotice() {
  return `
    <div class="trust-strip trust-strip--escrow">
      <strong>에스크로 안전 정산</strong>
      <p>참여자 결제금은 서비스 이용 완료 전까지 보호돼요.</p>
    </div>
  `;
}
```

- [ ] **Step 6: Re-run the targeted tests and verify the new escrow UI and stepper pass**

Run: `node --test tests\potmate-core.test.js tests\chat-ui-shell.test.js`

Expected: PASS for the escrow stepper, trust copy, and host progression behavior.

- [ ] **Step 7: Commit the settlement trust and stepper changes**

```bash
git add js/potmate-core.js js/app.js tests/potmate-core.test.js tests/chat-ui-shell.test.js
git commit -m "feat: strengthen escrow settlement ux"
```

### Task 5: Polish styles, regenerate the bundle, and verify the shipped experience

**Files:**
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\css\style.css`
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\style-smoke.test.js`
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\tests\potmate-demo-bundle.test.js`
- Regenerate: `C:\Users\wgiju\OneDrive\문서\codex\tmp\second-project-publish\potmate_demo.html`

- [ ] **Step 1: Write the failing style and bundle tests for the new auth/trust tokens**

```js
test('style.css defines the onboarding pager, auth tabs, verification cards, and escrow stepper', () => {
  [
    '.onboarding-pager',
    '.onboarding-dot',
    '.auth-screen',
    '.auth-tabs',
    '.signup-form',
    '.verification-screen',
    '.verification-card--primary',
    '.trust-strip',
    '.escrow-badge',
    '.settlement-stepper'
  ].forEach((token) => assert.ok(css.includes(token), `Missing token: ${token}`));
});

test('potmate_demo.html includes the new onboarding and verification experience', () => {
  [
    '같이 N빵할 사람 구해요',
    '근처 대학생과 쉽고 빠르게',
    '모집부터 정산까지 한 번에',
    '검증된 캠퍼스 메이트로 시작하세요',
    '네이버 학생증 인증',
    '에스크로 안전 정산'
  ].forEach((token) => assert.ok(bundle.includes(token), `Missing token: ${token}`));
});
```

- [ ] **Step 2: Run the targeted style and bundle tests and verify they fail before the CSS is added**

Run: `node --test tests\style-smoke.test.js tests\potmate-demo-bundle.test.js`

Expected: FAIL because the CSS and generated bundle do not yet expose the new onboarding/auth/trust tokens.

- [ ] **Step 3: Add the required visual styles for the new entry and trust surfaces**

```css
.onboarding-pager {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.onboarding-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(170, 1, 231, 0.2);
}

.onboarding-dot.is-active {
  width: 24px;
  background: var(--gradient-main);
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
}

.verification-card--primary {
  border: 1px solid rgba(170, 1, 231, 0.22);
  box-shadow: 0 16px 36px rgba(170, 1, 231, 0.12);
}

.trust-strip {
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(248, 231, 254, 0.9) 0%, rgba(255, 255, 255, 0.96) 100%);
}

.settlement-stepper {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
```

- [ ] **Step 4: Rebuild the standalone demo and run the full test suite**

Run: `node scripts\build-potmate-demo.js`

Expected: command exits `0` and rewrites `potmate_demo.html`.

Run: `node --test tests\*.test.js`

Expected: PASS for all onboarding, auth, verification, trust, settlement, style, and bundle tests.

- [ ] **Step 5: Commit the styling, bundle, and verification updates**

```bash
git add css/style.css tests/style-smoke.test.js tests/potmate-demo-bundle.test.js potmate_demo.html
git commit -m "style: polish auth trust onboarding surfaces"
```
