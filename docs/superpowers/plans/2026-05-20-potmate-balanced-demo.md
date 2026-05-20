# PotMate Balanced Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the static PotMate demo into a hub-first balanced product prototype that covers discovery, joining, chat-led coordination, and safe settlement across all four categories.

**Architecture:** Keep the current static architecture of seed data, pure core logic, and render/controller code, but enrich the data model and UI states so the app behaves like a coherent service demo rather than a simple screen list. Use deterministic front-end state transitions for location gating, join validation, chat status, settlement progress, and wallet history.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, Node.js `node:test`, GitHub Pages-friendly self-bundling via `scripts/build-potmate-demo.js`

---

### Task 1: Expand the seed model and core business logic

**Files:**
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\js\potmate-data.js`
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\js\potmate-core.js`
- Test: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\tests\potmate-core.test.js`

- [ ] **Step 1: Write the failing tests for richer filtering, sorting, radius validation, and wallet shaping**

```js
test('filterPots applies category, query, and radius filtering together', () => {
  const result = filterPots(pots, { category: '배달팟', query: '마라', radius: 300 });
  assert.deepEqual(result.map((pot) => pot.id), ['pot-delivery-near']);
});

test('sortPots supports distance and urgency ordering', () => {
  assert.deepEqual(sortPots(pots, 'distance').map((pot) => pot.id), ['pot-taxi-near', 'pot-delivery-near', 'pot-etc-far']);
  assert.deepEqual(sortPots(pots, 'urgent').map((pot) => pot.id), ['pot-delivery-near', 'pot-taxi-near', 'pot-etc-far']);
});

test('canJoinPot blocks joins outside the allowed radius', () => {
  assert.deepEqual(canJoinPot(pots[0], 25000, 620), {
    ok: false,
    reason: '참여 가능 거리 밖에 있어요. 위치 인증 후 다시 시도해 주세요.'
  });
});

test('createPot normalizes trust badges, category detail, and default recruitment state', () => {
  const pot = createPot({ category: '구독팟', title: '넷플릭스 4인팟', serviceName: '넷플릭스', period: '30일' }, () => 'new-pot');
  assert.equal(pot.recruitStatus, '모집중');
  assert.equal(pot.settlementStage, '정산 대기');
  assert.ok(pot.trustBadges.includes('안전정산'));
});

test('buildWalletSections groups pending and completed payment history', () => {
  const sections = buildWalletSections(state);
  assert.equal(sections.pending.length, 2);
  assert.equal(sections.completed.length, 1);
  assert.equal(sections.recent[0].id, 'charge-1');
});
```

- [ ] **Step 2: Run the targeted core test file and verify the new expectations fail for the expected missing features**

Run: `node --test tests\potmate-core.test.js`

Expected: FAIL with missing exports or assertion failures for radius filtering, sorting, or wallet grouping.

- [ ] **Step 3: Implement the richer data model and pure state helpers**

```js
function filterPots(pots, filters) {
  const category = filters.category || '전체';
  const query = (filters.query || '').trim().toLowerCase();
  const radius = Number(filters.radius || 0);

  return pots.filter((pot) => {
    const categoryMatches = category === '전체' || pot.category === category;
    const queryMatches = !query || searchTextFor(pot).includes(query);
    const radiusMatches = !radius || Number(pot.distanceMeters || 0) <= radius;
    return categoryMatches && queryMatches && radiusMatches;
  });
}

function sortPots(pots, sortMode) {
  const items = clone(pots);
  if (sortMode === 'urgent') {
    return items.sort((left, right) => Number(left.urgencyRank || 99) - Number(right.urgencyRank || 99));
  }
  return items.sort((left, right) => Number(left.distanceMeters || 0) - Number(right.distanceMeters || 0));
}

function canJoinPot(pot, pointBalance, userDistance) {
  if (pot.recruitStatus && pot.recruitStatus !== '모집중') {
    return { ok: false, reason: '지금은 참여할 수 없는 모집 상태예요.' };
  }
  if (pot.currentMembers >= pot.maxMembers) {
    return { ok: false, reason: '모집 인원이 모두 찼어요.' };
  }
  if (Number(userDistance || pot.distanceMeters || 0) > Number(pot.joinRadiusMeters || 0)) {
    return { ok: false, reason: '참여 가능 거리 밖에 있어요. 위치 인증 후 다시 시도해 주세요.' };
  }
  if (Number(pointBalance || 0) < Number(pot.perPersonAmount || 0)) {
    return { ok: false, reason: '포인트가 부족해요. 충전 후 참여해 주세요.' };
  }
  return { ok: true };
}

function buildWalletSections(state) {
  const payments = clone(state.payments || []);
  return {
    pending: payments.filter((item) => item.status === '정산 요청됨' || item.status === '참여중'),
    completed: payments.filter((item) => item.status === '정산 완료' || item.status === '충전 완료'),
    recent: payments
  };
}
```

- [ ] **Step 4: Re-run the targeted core test file and verify it passes**

Run: `node --test tests\potmate-core.test.js`

Expected: PASS for all core business logic cases.

- [ ] **Step 5: Commit the core data-model and business-logic changes**

```bash
git add js/potmate-data.js js/potmate-core.js tests/potmate-core.test.js
git commit -m "feat: expand potmate core state and logic"
```

### Task 2: Rebuild the app shell around the hub-first balanced flow

**Files:**
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\js\app.js`
- Test: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\tests\chat-ui-shell.test.js`
- Test: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\tests\index-shell.test.js`

- [ ] **Step 1: Write the failing UI shell tests for the new home, detail, and payment hooks**

```js
test('app shell exposes home hub and control tokens', () => {
  [
    'radius-filter',
    'sort-filter',
    'hub-highlight',
    'closing-soon-section',
    'category-spotlight'
  ].forEach((token) => assert.ok(app.includes(token), `Missing token: ${token}`));
});

test('detail and payment shells expose trust and wallet hooks', () => {
  [
    'trust-badge',
    'timeline-card',
    'settlement-stage',
    'wallet-quick-charge',
    'coupon-card'
  ].forEach((token) => assert.ok(app.includes(token), `Missing token: ${token}`));
});
```

- [ ] **Step 2: Run the UI shell tests and verify they fail because the new hooks are not rendered yet**

Run: `node --test tests\chat-ui-shell.test.js tests\index-shell.test.js`

Expected: FAIL with missing UI tokens.

- [ ] **Step 3: Refactor the render layer to support a richer screen model**

```js
let state = {
  ...clone(window.PotMateSeed),
  route: 'onboarding',
  selectedCategory: '전체',
  selectedPotId: null,
  query: '',
  radiusFilter: 500,
  sortMode: 'distance',
  settlementTotal: 0,
  createCategory: '배달팟'
};

function renderHome() {
  const visible = core.sortPots(
    core.filterPots(state.pots, {
      category: state.selectedCategory,
      query: state.query,
      radius: state.radiusFilter
    }),
    state.sortMode
  );

  app.innerHTML = `
    <section class="screen screen-enter">
      <header class="topbar topbar--hub">
        <span class="location-pill">현재 위치 · ${state.user.campus}</span>
        <span class="status-pill">${won(state.pointBalance)}</span>
      </header>
      <section class="hub-highlight">
        ...
      </section>
      <div class="filter-row">
        <select id="radius-filter">...</select>
        <select id="sort-filter">...</select>
      </div>
      <section class="closing-soon-section">...</section>
      <section class="category-spotlight">...</section>
    </section>
    ${nav('home')}
  `;
}
```

- [ ] **Step 4: Re-run the UI shell tests and verify they pass**

Run: `node --test tests\chat-ui-shell.test.js tests\index-shell.test.js`

Expected: PASS for the new app shell hooks.

- [ ] **Step 5: Commit the render-layer flow update**

```bash
git add js/app.js tests/chat-ui-shell.test.js tests/index-shell.test.js
git commit -m "feat: rebuild potmate into a hub-first demo flow"
```

### Task 3: Upgrade the styling to match the richer product flow

**Files:**
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\css\style.css`
- Test: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\tests\style-smoke.test.js`

- [ ] **Step 1: Write the failing style smoke assertions for the new layout and interaction classes**

```js
test('style.css defines the richer hub, wallet, and stage components', () => {
  [
    '.hub-highlight',
    '.filter-row',
    '.spotlight-grid',
    '.trust-badge',
    '.timeline-card',
    '.stage-track',
    '.wallet-quick-charge',
    '.coupon-card',
    '.screen-enter'
  ].forEach((token) => {
    assert.ok(css.includes(token), `Missing token: ${token}`);
  });
});
```

- [ ] **Step 2: Run the style smoke test and verify it fails because the new component classes do not exist yet**

Run: `node --test tests\style-smoke.test.js`

Expected: FAIL with missing class tokens.

- [ ] **Step 3: Extend the style system for the balanced-demo layout**

```css
.hub-highlight {
  padding: 20px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,231,254,0.92) 100%);
  box-shadow: var(--shadow-card);
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stage-track {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.wallet-quick-charge {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.screen-enter {
  animation: screenEnter 220ms ease;
}

@keyframes screenEnter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 4: Re-run the style smoke test and verify it passes**

Run: `node --test tests\style-smoke.test.js`

Expected: PASS for all new style hooks.

- [ ] **Step 5: Commit the visual-system expansion**

```bash
git add css/style.css tests/style-smoke.test.js
git commit -m "style: expand potmate balanced demo interface"
```

### Task 4: Regenerate the self-contained bundle and verify the full demo

**Files:**
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\potmate_demo.html`
- Modify: `C:\Users\wgiju\OneDrive\문서\codex\tmp\potmate-demo\tests\potmate-demo-bundle.test.js`

- [ ] **Step 1: Update the bundle smoke test to assert the new product surface tokens**

```js
test('potmate_demo.html bundles the expanded balanced demo', () => {
  [
    'radius-filter',
    'closing-soon-section',
    'trust-badge',
    'settlement-stage',
    'wallet-quick-charge',
    'coupon-card'
  ].forEach((token) => assert.ok(html.includes(token), `Missing token: ${token}`));
});
```

- [ ] **Step 2: Run the bundle smoke test and verify it fails before regeneration**

Run: `node --test tests\potmate-demo-bundle.test.js`

Expected: FAIL with missing bundled tokens.

- [ ] **Step 3: Rebuild the self-contained HTML bundle**

```js
node scripts/build-potmate-demo.js
```

- [ ] **Step 4: Run the full test suite and verify every test passes**

Run: `node --test tests\*.test.js`

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit the rebuilt bundle and final test updates**

```bash
git add potmate_demo.html tests/potmate-demo-bundle.test.js
git commit -m "build: refresh potmate balanced demo bundle"
```
