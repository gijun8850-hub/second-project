const core = window.PotMateCore;
const categories = ['전체', '배달팟', '택시팟', '구독팟', '기타팟'];
const createCategories = categories.slice(1);

let state = {
  ...JSON.parse(JSON.stringify(window.PotMateSeed)),
  route: 'onboarding',
  selectedCategory: '전체',
  query: '',
  selectedPotId: 'pot-taxi-1',
  radiusFilter: 500,
  sortMode: 'distance',
  settlementTotal: 26000,
  createCategory: '배달팟'
};

let isSearchComposing = false;

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');

function won(amount) {
  return core.formatWon(amount);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function potById(id) {
  return state.pots.find((pot) => pot.id === id);
}

function isJoined(pot) {
  return Boolean((pot.participants || []).some((member) => member.id === state.user.id));
}

function currentMember(pot) {
  return (pot.participants || []).find((member) => member.id === state.user.id);
}

function heroSpotlightText(pot) {
  if (!pot) {
    return {
      title: '내 주변 추천',
      description: '지금 근처에서 바로 참여할 수 있는 팟을 보여드려요.'
    };
  }

  const seatsLeft = Math.max(pot.maxMembers - pot.currentMembers, 0);
  return {
    title: '내 주변 추천',
    description: `${pot.distanceMeters}m · ${pot.subCategory} · ${seatsLeft}명 남음`
  };
}

function getHomeSections() {
  return core.buildHomeSections(state.pots, {
    category: state.selectedCategory,
    query: state.query,
    radius: state.radiusFilter,
    sortMode: state.sortMode
  });
}

function renderHomeCategoryStats(sections) {
  return sections.categoryStats.map((item) => `
    <div class="hub-stat">
      <span>${item.category}</span>
      <strong>${item.count}개</strong>
      <span class="hub-stat__meta">${item.closestDistance === null ? '모집 없음' : `${item.closestDistance}m부터`}</span>
    </div>
  `).join('');
}

function renderHomeSpotlight(sections) {
  const spotlightPot = sections.recommended[0] || sections.visible[0] || state.pots[0];
  const spotlight = heroSpotlightText(spotlightPot);

  return `
    <strong>${spotlight.title}</strong>
    <span>${spotlight.description}</span>
  `;
}

function renderHomeResults(sections) {
  const promo = state.promoBanners[0];

  return `
    <section class="home-section">
      <div class="section-heading">
        <h2>지금 참여하기 좋은 팟</h2>
        <span>${sections.visible.length}개</span>
      </div>
      <div class="pot-list pot-list--home">
        ${sections.recommended.length
          ? sections.recommended.map((pot) => potCard(pot)).join('')
          : '<div class="empty-state">조건에 맞는 팟이 아직 없어요.</div>'}
      </div>
    </section>

    <section class="home-section closing-soon-section">
      <div class="section-heading">
        <h2>마감 임박</h2>
        <span>놓치기 전에 확인</span>
      </div>
      <div class="spotlight-grid">
        ${sections.closingSoon.length
          ? sections.closingSoon.map((pot) => potCard(pot, { compact: true })).join('')
          : '<div class="empty-state">급한 모집은 아직 없어요.</div>'}
      </div>
    </section>

    <section class="home-section category-spotlight">
      <div class="section-heading">
        <h2>카테고리별 대표 팟</h2>
        <span>균형 있게 둘러보기</span>
      </div>
      <div class="spotlight-grid">
        ${sections.categorySpotlights.map((pot) => potCard(pot, { compact: true })).join('')}
      </div>
    </section>

    <section class="home-section">
      <div class="coupon-card">
        <span>${promo.label}</span>
        <strong>${promo.title}</strong>
        <p>${promo.description}</p>
      </div>
    </section>
  `;
}

function updateHomeSearchResults(input) {
  if (state.route !== 'home') {
    return;
  }

  const value = input ? input.value : state.query;
  const selectionStart = input ? input.selectionStart : null;
  const selectionEnd = input ? input.selectionEnd : null;

  state.query = value;
  const sections = getHomeSections();

  const stats = document.querySelector('#home-category-stats');
  if (stats) {
    stats.innerHTML = renderHomeCategoryStats(sections);
  }

  const spotlight = document.querySelector('#home-spotlight-card');
  if (spotlight) {
    spotlight.innerHTML = renderHomeSpotlight(sections);
  }

  const results = document.querySelector('#home-results');
  if (results) {
    results.innerHTML = renderHomeResults(sections);
  }

  if (!input) {
    return;
  }

  const nextInput = document.querySelector('#search-input');
  if (!nextInput) {
    return;
  }

  nextInput.focus();
  const cursorStart = typeof selectionStart === 'number' ? selectionStart : value.length;
  const cursorEnd = typeof selectionEnd === 'number' ? selectionEnd : cursorStart;
  nextInput.setSelectionRange(cursorStart, cursorEnd);
}

function setRoute(route, selectedPotId) {
  state.route = route;
  if (selectedPotId) {
    state.selectedPotId = selectedPotId;
  }
  render();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function nav(active) {
  return `
    <nav class="bottom-nav">
      ${[
        ['home', '홈'],
        ['create', '팟 만들기'],
        ['chat', '채팅'],
        ['my', 'My 결제']
      ].map(([route, label]) => `
        <button type="button" class="${active === route ? 'is-active' : ''}" data-route="${route}">${label}</button>
      `).join('')}
    </nav>
  `;
}

function backButton(target = 'home') {
  return `<button class="back-button" type="button" data-route="${target}" aria-label="뒤로">‹</button>`;
}

function trustBadges(pot) {
  return `
    <div class="trust-row">
      ${(pot.trustBadges || []).map((badge) => `<span class="trust-badge">${badge}</span>`).join('')}
    </div>
  `;
}

function participantStrip(pot) {
  const visible = (pot.participants || []).slice(0, 4);
  return `
    <div class="participant-strip">
      ${visible.map((member) => `<span class="avatar">${member.avatar || member.name[0]}</span>`).join('')}
      <span class="participant-count">${pot.currentMembers}/${pot.maxMembers}명</span>
    </div>
  `;
}

function stageTrack(stage) {
  return `
    <div class="settlement-stage">
      <div class="stage-track">
        ${core.buildSettlementStages(stage).map((item) => `
          <div class="stage-step is-${item.state}">
            <strong>${item.label}</strong>
            <span>${item.state === 'done' ? '완료' : item.state === 'current' ? '진행중' : '대기'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function detailRows(pot) {
  const labelMap = {
    subCategory: '세부 카테고리',
    menuHighlight: '대표 메뉴',
    orderTime: '주문 예정 시간',
    pickupPoint: '수령 장소',
    departurePoint: '출발 지점',
    destination: '도착 지점',
    departureTime: '출발 시간',
    estimatedFare: '예상 택시비',
    serviceName: '서비스명',
    period: '이용 기간',
    seatType: '공유 방식',
    purpose: '모임 목적',
    place: '만나는 장소',
    estimatedAmount: '예상 총액'
  };

  return Object.entries(pot.detail || {}).map(([key, value]) => `
    <div class="info-row">
      <span>${labelMap[key] || key}</span>
      <strong>${value}</strong>
    </div>
  `).join('');
}

function timelineCard(pot) {
  const timeline = Array.isArray(pot.timeline) ? pot.timeline : [];
  return `
    <article class="glass-card timeline-card">
      <div class="section-heading">
        <h2>진행 타임라인</h2>
      </div>
      <div class="timeline-list">
        ${timeline.map((item) => `
          <div class="timeline-item is-${item.state}">
            <span class="timeline-dot"></span>
            <div>
              <strong>${item.label}</strong>
              <p>${item.state === 'done' ? '이 단계는 완료됐어요.' : item.state === 'current' ? '지금 진행 중인 단계예요.' : '다음 단계에서 이어져요.'}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}

function potCard(pot, options = {}) {
  const compact = Boolean(options.compact);
  const seatsLeft = Math.max(pot.maxMembers - pot.currentMembers, 0);
  const joined = isJoined(pot);

  return `
    <article class="pot-card ${compact ? 'pot-card--compact' : ''}" data-pot-id="${pot.id}">
      <div class="pot-card__head">
        <span class="category-badge">${pot.category}</span>
        <span class="status-pill">${pot.urgencyLabel || pot.recruitStatus}</span>
      </div>
      <h2>${pot.title}</h2>
      <p class="card-copy">${pot.description}</p>
      ${trustBadges(pot)}
      <div class="meta-grid">
        <div class="meta-chip">거리<strong>${pot.distanceMeters}m</strong></div>
        <div class="meta-chip">남은 자리<strong>${seatsLeft}명</strong></div>
        <div class="meta-chip">예상 금액<strong>${won(pot.perPersonAmount)}</strong></div>
        <div class="meta-chip">마감/상태<strong>${pot.deadlineLabel}</strong></div>
      </div>
      <div class="pot-card__footer">
        <span class="inline-note">${pot.subCategory}</span>
        <button class="gradient-button ${compact ? '' : 'full-button'}" type="button" data-join-id="${pot.id}">
          ${joined ? '채팅으로 이동' : '참여하기'}
        </button>
      </div>
    </article>
  `;
}

function historyCard(payment) {
  return `
    <article class="history-card">
      <div>
        <strong>${payment.title}</strong>
        <span>${payment.category} · ${payment.date}</span>
      </div>
      <div class="history-card__meta">
        <strong>${won(payment.amount)}</strong>
        <span>${payment.status}</span>
      </div>
    </article>
  `;
}

function categoryFields(category) {
  if (category === '배달팟') {
    return `
      <label class="form-field">
        <span>세부 카테고리</span>
        <select name="subCategory">
          <option>치킨</option>
          <option selected>마라탕</option>
          <option>카페</option>
          <option>디저트</option>
          <option>패스트푸드</option>
        </select>
      </label>
      <label class="form-field"><span>대표 메뉴</span><input name="menuHighlight" placeholder="예: 마라탕 + 꿔바로우"></label>
      <label class="form-field"><span>주문 예정 시간</span><input name="orderTime" placeholder="예: 오늘 18:40"></label>
      <label class="form-field"><span>수령 장소</span><input name="pickupPoint" placeholder="예: 비전타워 1층"></label>
    `;
  }

  if (category === '택시팟') {
    return `
      <label class="form-field"><span>세부 카테고리</span><input name="subCategory" value="심야귀가"></label>
      <label class="form-field"><span>출발 지점</span><input name="departurePoint" placeholder="예: 가천대 정문 앞"></label>
      <label class="form-field"><span>도착 지점</span><input name="destination" placeholder="예: 강남역 11번 출구"></label>
      <label class="form-field"><span>출발 시간</span><input name="departureTime" placeholder="예: 오늘 21:20"></label>
      <label class="form-field"><span>예상 택시비</span><input name="estimatedFare" placeholder="예: 총 26,000원 예상"></label>
    `;
  }

  if (category === '구독팟') {
    return `
      <label class="form-field"><span>세부 카테고리</span><input name="subCategory" value="OTT"></label>
      <label class="form-field"><span>서비스명</span><input name="serviceName" placeholder="예: 넷플릭스 프리미엄"></label>
      <label class="form-field"><span>이용 기간</span><input name="period" placeholder="예: 2026.05.01 - 2026.05.31"></label>
      <label class="form-field"><span>공유 방식</span><input name="seatType" placeholder="예: 4인 공유"></label>
    `;
  }

  return `
    <label class="form-field"><span>세부 카테고리</span><input name="subCategory" value="공동구매"></label>
    <label class="form-field"><span>모임 목적</span><input name="purpose" placeholder="예: 시험기간 간식 공동구매"></label>
    <label class="form-field"><span>만나는 장소</span><input name="place" placeholder="예: 중앙도서관 라운지"></label>
    <label class="form-field"><span>예상 총액</span><input name="estimatedAmount" placeholder="예: 총 24,000원 예상"></label>
  `;
}

function renderOnboarding() {
  app.innerHTML = `
    <section class="onboarding-screen onboarding-screen--scene screen-enter" style="--onboarding-scene: url('./images/onboarding-campus.png');">
      <div class="onboarding-header">
        <div class="onboarding-brand">
          <span class="brand-icon">P</span>
          <strong>PotMate</strong>
        </div>
        <button class="onboarding-alert" type="button" aria-label="알림">
          <span>🔔</span>
          <i></i>
        </button>
      </div>

      <div class="onboarding-copy">
        <h1 aria-label="근처 팟, 바로 합류">근처 팟,<br><span>바로 합류</span></h1>
        <p>캠퍼스 N빵을 더 쉽고 빠르게</p>
      </div>

      <div class="onboarding-photo-card" aria-hidden="true">
        <div class="onboarding-photo"></div>
      </div>

      <div class="onboarding-card-stack">
        <article class="onboarding-action-card">
          <div class="onboarding-action-icon onboarding-action-icon--pin">
            <span>1</span>
          </div>
          <div class="onboarding-action-copy">
            <strong>근처 팟 추천</strong>
            <p>가천대 180m · 마라탕 · <em>1명 남음</em></p>
          </div>
          <span class="onboarding-action-arrow">›</span>
        </article>

        <article class="onboarding-action-card">
          <div class="onboarding-action-icon onboarding-action-icon--shield">✓</div>
          <div class="onboarding-action-copy">
            <strong>안전한 정산</strong>
            <p>참여 후 채팅하고 바로 정산</p>
          </div>
          <span class="onboarding-action-arrow">›</span>
        </article>
      </div>

      <div class="onboarding-chip-block">
        <strong class="onboarding-chip-title">어떤 팟을 찾고 있나요?</strong>
        <div class="onboarding-chip-row">
          ${createCategories.map((category, index) => `
            <span class="onboarding-chip ${index === 0 ? 'is-active' : ''}">${category}</span>
          `).join('')}
        </div>
      </div>

      <button class="gradient-button full-button onboarding-start-button" type="button" data-route="home">바로 시작하기</button>
      <p class="onboarding-login-note">이미 계정이 있으신가요? <span>로그인</span></p>
    </section>
  `;
}

function renderHome(options = {}) {
  const animate = options.animate !== false;
  const sections = getHomeSections();

  app.innerHTML = `
    <section class="screen ${animate ? 'screen-enter' : ''}">
      <header class="topbar topbar--hub">
        <span class="location-pill">현재 위치 · ${state.user.locationLabel}</span>
        <span class="status-pill">${won(state.pointBalance)}</span>
      </header>

      <section class="hub-highlight">
        <div class="hub-highlight__label">Campus now</div>
        <div class="home-hero-note">근처 메이트를 가장 빠르게 만나는 캠퍼스 N빵 허브</div>
        <h1>주변 팟을 한눈에 보고 바로 참여해요</h1>
        <p>배달팟, 택시팟, 구독팟, 기타팟까지 거리와 마감순으로 빠르게 비교할 수 있어요.</p>
        <div class="student-chip-row student-chip-row--compact">
          ${createCategories.map((category) => `<span class="student-chip">${category}</span>`).join('')}
        </div>
        <div id="home-spotlight-card" class="hero-spotlight-card hero-spotlight-card--inline">
          ${renderHomeSpotlight(sections)}
        </div>
        <div id="home-category-stats" class="hub-summary-grid">
          ${renderHomeCategoryStats(sections)}
        </div>
      </section>

      <label class="search-box">
        <input id="search-input" type="search" value="${escapeHtml(state.query)}" placeholder="메뉴, 장소, 서비스명 검색">
      </label>

      <div class="filter-row">
        <label class="filter-field">
          <span>반경</span>
          <select id="radius-filter">
            ${[300, 500, 1000].map((radius) => `<option value="${radius}" ${radius === state.radiusFilter ? 'selected' : ''}>${radius}m</option>`).join('')}
          </select>
        </label>
        <label class="filter-field">
          <span>정렬</span>
          <select id="sort-filter">
            <option value="distance" ${state.sortMode === 'distance' ? 'selected' : ''}>거리순</option>
            <option value="urgent" ${state.sortMode === 'urgent' ? 'selected' : ''}>마감임박순</option>
          </select>
        </label>
      </div>

      <div class="category-tabs">
        ${categories.map((category) => `
          <button type="button" class="${category === state.selectedCategory ? 'is-active' : ''}" data-category="${category}">${category}</button>
        `).join('')}
      </div>

      <div id="home-results">
        ${renderHomeResults(sections)}
      </div>
    </section>
    ${nav('home')}
  `;
}

function renderDetail() {
  const pot = potById(state.selectedPotId);
  if (!pot) {
    setRoute('home');
    return;
  }

  const alreadyJoined = isJoined(pot);

  app.innerHTML = `
    <section class="screen screen-enter">
      <header class="topbar">
        ${backButton('home')}
        <span class="status-pill">${pot.category}</span>
      </header>

      <article class="glass-card detail-hero">
        <div class="pot-card__head">
          <span class="category-badge">${pot.category} · ${pot.subCategory}</span>
          <span class="status-pill">${pot.recruitStatus}</span>
        </div>
        <h1>${pot.title}</h1>
        <p>${pot.description}</p>
        ${trustBadges(pot)}
        ${participantStrip(pot)}
      </article>

      <article class="glass-card detail-grid">
        <div class="info-row"><span>방장</span><strong>${pot.host.name}</strong></div>
        <div class="info-row"><span>위치</span><strong>${pot.locationSummary}</strong></div>
        <div class="info-row"><span>참여 가능 반경</span><strong>${pot.joinRadiusMeters}m 이내</strong></div>
        <div class="info-row"><span>현재 거리</span><strong>${pot.distanceMeters}m</strong></div>
        <div class="info-row"><span>모집 인원</span><strong>${pot.currentMembers}/${pot.maxMembers}명</strong></div>
        <div class="info-row"><span>예상 1인 금액</span><strong>${won(pot.perPersonAmount)}</strong></div>
        <div class="info-row"><span>마감 상태</span><strong>${pot.deadlineLabel}</strong></div>
        ${detailRows(pot)}
      </article>

      ${timelineCard(pot)}

      <div class="fixed-action">
        <button class="gradient-button full-button" type="button" data-route="${alreadyJoined ? 'chat' : 'confirm'}" data-select-pot="${pot.id}">
          ${alreadyJoined ? '채팅방 가기' : '참여 조건 보기'}
        </button>
      </div>
    </section>
    ${nav('home')}
  `;
}

function renderConfirm() {
  const pot = potById(state.selectedPotId);
  if (!pot) {
    setRoute('home');
    return;
  }

  const result = core.canJoinPot(pot, state.pointBalance, pot.distanceMeters);

  app.innerHTML = `
    <section class="screen screen-enter">
      <header class="topbar">
        ${backButton('detail')}
        <span class="status-pill">참여 확인</span>
      </header>

      <article class="glass-card join-summary">
        <span class="category-badge">${pot.category}</span>
        <h1>${pot.title}</h1>
        <span class="price-xl">${won(pot.perPersonAmount)}</span>
        <div class="info-row"><span>현재 포인트</span><strong>${won(state.pointBalance)}</strong></div>
        <div class="info-row"><span>위치 조건</span><strong>${pot.joinRadiusMeters}m 이내</strong></div>
      </article>

      <p class="notice">참여 후에는 채팅방으로 이동하고, 정산이 시작되면 안전 결제로 이어집니다.</p>

      ${result.ok ? `
        <button class="gradient-button full-button" type="button" data-confirm-join="${pot.id}">채팅방 들어가기</button>
      ` : `
        <p class="notice notice--warning">${result.reason}</p>
        <div class="wallet-quick-charge">
          ${state.chargeOptions.map((amount) => `
            <button class="secondary-button quick-charge-button" type="button" data-charge="${amount}">${amount.toLocaleString('ko-KR')}P</button>
          `).join('')}
        </div>
        <button class="gradient-button full-button" type="button" disabled>참여할 수 없어요</button>
      `}
    </section>
    ${nav('home')}
  `;
}

function memberForMessage(pot, message) {
  if (message.from === state.user.id || message.mine) {
    return { id: state.user.id, name: state.user.name, avatar: state.user.avatar, isMe: true };
  }

  return (pot.participants || []).find((member) => member.id === message.from)
    || (message.from === pot.host.id ? pot.host : null)
    || { id: message.from, name: message.name || '메이트', avatar: (message.name || '메')[0] };
}

function renderMessage(pot, message) {
  if (message.system || message.type === 'system') {
    return `<div class="message system">${message.text}</div>`;
  }

  const isOwn = message.mine || message.from === state.user.id;
  const member = memberForMessage(pot, message);
  const isHostMessage = message.from === pot.host.id || message.type === 'host';

  return `
    <div class="message-row ${isOwn ? 'is-own' : ''}">
      ${isOwn ? '' : `<div class="message-profile">${member.avatar || member.name[0]}</div>`}
      <div class="message-body">
        ${isOwn ? '' : `
          <div class="message-name">
            <span>${member.name}</span>
            ${isHostMessage ? '<span class="host-badge">방장</span>' : ''}
          </div>
        `}
        <div class="message ${isOwn ? 'mine' : ''}">${message.text}</div>
      </div>
    </div>
  `;
}

function renderChat() {
  const pot = potById(state.selectedPotId || state.activeChatId) || state.pots[0];
  state.selectedPotId = pot.id;
  const chat = state.chats[pot.id] || { messages: [], notice: '' };
  const isHost = pot.host.id === state.user.id;
  const myMembership = currentMember(pot);
  const shouldPay = Boolean(myMembership && !myMembership.paid && pot.settlementStage === '정산 요청됨');

  app.innerHTML = `
    <section class="screen screen-enter">
      <header class="chat-header">
        <div class="chat-header__title">
          <strong>${pot.title}</strong>
          <span>${pot.currentMembers}/${pot.maxMembers}명 · ${pot.recruitStatus}</span>
        </div>
        <span class="status-pill">${pot.settlementStage}</span>
      </header>

      ${stageTrack(pot.settlementStage)}

      ${isHost ? `
        <div class="host-actions">
          <button type="button" data-close-pot="${pot.id}">모집 마감</button>
          <button type="button" data-route="settlement" data-select-pot="${pot.id}">정산 요청</button>
          <button type="button" data-manage="${pot.id}">대기 확인</button>
        </div>
      ` : ''}

      <div class="announcement">${chat.notice || '채팅에서 일정과 정산 안내를 함께 확인해 주세요.'}</div>

      <section class="chat-list">
        ${(chat.messages || []).map((message) => renderMessage(pot, message)).join('')}
      </section>

      <article class="glass-card">
        <div class="info-row"><span>현재 정산 상태</span><strong>${pot.settlementStage}</strong></div>
        <div class="info-row"><span>예상 결제 금액</span><strong>${won(pot.perPersonAmount)}</strong></div>
        ${trustBadges(pot)}
      </article>

      ${shouldPay ? `
        <button class="gradient-button full-button" type="button" data-pay-settlement="${pot.id}">내 몫 결제하기</button>
      ` : `
        <button class="secondary-button full-button" type="button" data-route="settlement" data-select-pot="${pot.id}">정산 상태 보기</button>
      `}

      <div class="chat-input">
        <input id="message-input" placeholder="채팅 메시지를 입력하세요">
        <button class="gradient-button" type="button" data-send-message="${pot.id}">보내기</button>
      </div>
    </section>
    ${nav('chat')}
  `;
}

function renderSettlement() {
  const pot = potById(state.selectedPotId || state.activeChatId);
  if (!pot) {
    setRoute('home');
    return;
  }

  const isHost = pot.host.id === state.user.id;
  const participants = pot.participants || [];
  const totalAmount = state.settlementTotal || pot.perPersonAmount * Math.max(participants.length, 1);
  const myMembership = currentMember(pot);
  const shouldPay = Boolean(myMembership && !myMembership.paid && pot.settlementStage === '정산 요청됨');

  app.innerHTML = `
    <section class="screen screen-enter">
      <header class="topbar">
        ${backButton('chat')}
        <span class="status-pill">정산 상태</span>
      </header>

      <div class="page-title">
        <h1>정산 진행 상태</h1>
        <p>누가 결제했고, 누가 아직 대기 중인지 실시간처럼 한눈에 보여줘요.</p>
      </div>

      ${stageTrack(pot.settlementStage)}

      <article class="glass-card">
        ${isHost ? `
          <label class="form-field">
            <span>총 금액</span>
            <input id="settlement-total" type="number" value="${totalAmount}">
          </label>
        ` : `
          <div class="info-row"><span>총 금액</span><strong>${won(totalAmount)}</strong></div>
        `}
        <div class="info-row"><span>참여 인원</span><strong>${participants.length}명</strong></div>
        <div class="info-row"><span>1인당 금액</span><strong>${won(Math.ceil(totalAmount / Math.max(participants.length, 1)))}</strong></div>
      </article>

      ${isHost && pot.settlementStage === '정산 대기' ? `
        <button class="gradient-button full-button" type="button" data-request-settlement="${pot.id}">정산 요청 보내기</button>
      ` : ''}

      ${shouldPay ? `
        <button class="gradient-button full-button" type="button" data-pay-settlement="${pot.id}">내 몫 결제하기</button>
      ` : ''}

      <section class="detail-stack">
        ${participants.map((member) => `
          <div class="settlement-row">
            <div>
              <strong>${member.name}</strong>
              <span>${member.paid ? '정산 완료' : '정산 대기'}</span>
            </div>
            ${member.paid
              ? '<span class="status-pill">완료</span>'
              : isHost
                ? `<button class="ghost-button" type="button" data-remind="${member.name}">리마인드</button>`
                : '<span class="status-pill">대기</span>'}
          </div>
        `).join('')}
      </section>
    </section>
    ${nav('chat')}
  `;
}

function renderMy() {
  const wallet = core.buildWalletSections(state);

  app.innerHTML = `
    <section class="screen screen-enter">
      <div class="page-title">
        <h1>My 결제</h1>
        <p>포인트, 진행 중인 정산, 최근 결제 기록을 금융앱처럼 깔끔하게 보여줘요.</p>
      </div>

      <article class="glass-card wallet-card">
        <span>보유 포인트</span>
        <strong class="price-xl">${won(state.pointBalance)}</strong>
        <p>안전 정산 대기 금액과 충전 내역을 함께 확인할 수 있어요.</p>
      </article>

      <div class="wallet-quick-charge">
        ${state.chargeOptions.map((amount) => `
          <button class="secondary-button quick-charge-button" type="button" data-charge="${amount}">
            ${amount.toLocaleString('ko-KR')}P
          </button>
        `).join('')}
      </div>

      <section class="payment-stack">
        <div class="section-heading">
          <h2>진행 중인 정산</h2>
        </div>
        ${wallet.pending.length
          ? wallet.pending.map(historyCard).join('')
          : '<div class="empty-state">진행 중인 정산이 없어요.</div>'}

        <div class="section-heading">
          <h2>정산 완료 / 충전 내역</h2>
        </div>
        ${wallet.completed.length
          ? wallet.completed.map(historyCard).join('')
          : '<div class="empty-state">완료된 내역이 없어요.</div>'}

        <div class="section-heading">
          <h2>쿠폰</h2>
        </div>
        <div class="coupon-grid">
          ${state.coupons.map((coupon) => `
            <article class="coupon-card">
              <span>${coupon.appliesTo}</span>
              <strong>${coupon.title}</strong>
              <p>${coupon.benefit}</p>
            </article>
          `).join('')}
        </div>

        <div class="section-heading">
          <h2>최근 활동</h2>
        </div>
        ${wallet.recent.map(historyCard).join('')}
      </section>
    </section>
    ${nav('my')}
  `;
}

function renderCreate() {
  const category = state.createCategory || '배달팟';

  app.innerHTML = `
    <section class="screen screen-enter">
      <div class="page-title">
        <h1>팟 만들기</h1>
        <p>입력 단계를 줄이고 필요한 정보만 보여줘서 빠르게 모집을 열 수 있게 해요.</p>
      </div>

      <form id="create-form" class="form-stack">
        <label class="form-field">
          <span>카테고리</span>
          <select name="category" id="create-category">
            ${createCategories.map((item) => `<option ${item === category ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
        </label>
        <label class="form-field"><span>팟 제목</span><input name="title" required placeholder="예: 마라탕 같이 시켜요"></label>
        <label class="form-field"><span>모집 인원</span><input name="maxMembers" type="number" min="2" value="4"></label>
        <label class="form-field"><span>예상 1인 금액</span><input name="perPersonAmount" type="number" value="8000"></label>
        <label class="form-field"><span>위치 요약</span><input name="locationSummary" required placeholder="예: 가천대 정문 앞"></label>
        <label class="form-field"><span>마감 상태 문구</span><input name="deadlineLabel" placeholder="예: 오늘 22:00 마감"></label>
        ${categoryFields(category)}
        <label class="form-field"><span>설명</span><textarea name="description" placeholder="메이트에게 보여줄 간단한 설명"></textarea></label>
        <button class="gradient-button full-button" type="submit">새 팟 생성하기</button>
      </form>
    </section>
    ${nav('create')}
  `;
}

function render() {
  switch (state.route) {
    case 'home':
      renderHome();
      break;
    case 'detail':
      renderDetail();
      break;
    case 'confirm':
      renderConfirm();
      break;
    case 'chat':
      renderChat();
      break;
    case 'settlement':
      renderSettlement();
      break;
    case 'my':
      renderMy();
      break;
    case 'create':
      renderCreate();
      break;
    default:
      renderOnboarding();
      break;
  }
}

app.addEventListener('click', (event) => {
  const routeButton = event.target.closest('[data-route]');
  const joinButton = event.target.closest('[data-join-id]');
  const confirmJoin = event.target.closest('[data-confirm-join]');
  const chargeButton = event.target.closest('[data-charge]');
  const requestSettlementButton = event.target.closest('[data-request-settlement]');
  const remindButton = event.target.closest('[data-remind]');
  const sendMessageButton = event.target.closest('[data-send-message]');
  const closePotButton = event.target.closest('[data-close-pot]');
  const manageButton = event.target.closest('[data-manage]');
  const payButton = event.target.closest('[data-pay-settlement]');
  const openCard = event.target.closest('[data-pot-id]');
  const selectPotButton = event.target.closest('[data-select-pot]');

  if (joinButton) {
    event.stopPropagation();
    const pot = potById(joinButton.dataset.joinId);
    if (pot && isJoined(pot)) {
      state.activeChatId = pot.id;
      setRoute('chat', pot.id);
      return;
    }
    setRoute('confirm', joinButton.dataset.joinId);
    return;
  }

  if (openCard) {
    setRoute('detail', openCard.dataset.potId);
    return;
  }

  if (selectPotButton) {
    state.selectedPotId = selectPotButton.dataset.selectPot;
  }

  if (routeButton) {
    const route = routeButton.dataset.route;
    if (route === 'chat') {
      setRoute('chat', state.activeChatId || state.selectedPotId || state.pots[0].id);
      return;
    }
    if (route === 'settlement') {
      const targetPot = state.selectedPotId || state.activeChatId || state.pots[0].id;
      const pot = potById(targetPot);
      if (pot) {
        state.settlementTotal = pot.perPersonAmount * Math.max((pot.participants || []).length, 1);
      }
      setRoute('settlement', targetPot);
      return;
    }
    setRoute(route, state.selectedPotId);
    return;
  }

  if (confirmJoin) {
    state = core.joinPot(state, confirmJoin.dataset.confirmJoin);
    state.activeChatId = confirmJoin.dataset.confirmJoin;
    showToast('참여가 확정됐어요. 채팅방에서 일정과 정산을 이어가세요.');
    setRoute('chat', confirmJoin.dataset.confirmJoin);
    return;
  }

  if (chargeButton) {
    state = core.chargePoints(state, Number(chargeButton.dataset.charge));
    showToast(`${Number(chargeButton.dataset.charge).toLocaleString('ko-KR')}P가 충전됐어요.`);
    render();
    return;
  }

  if (requestSettlementButton) {
    state = core.requestSettlement(state, requestSettlementButton.dataset.requestSettlement, state.settlementTotal);
    showToast('정산 요청을 보냈어요. 채팅방과 My 결제에서 상태가 함께 갱신됩니다.');
    setRoute('chat', requestSettlementButton.dataset.requestSettlement);
    return;
  }

  if (remindButton) {
    showToast(core.sendReminder(remindButton.dataset.remind));
    return;
  }

  if (sendMessageButton) {
    const input = document.querySelector('#message-input');
    const text = input.value.trim();
    if (!text) return;
    state = core.sendChatMessage(state, sendMessageButton.dataset.sendMessage, {
      from: state.user.id,
      name: state.user.name,
      text,
      mine: true,
      type: 'mine'
    });
    render();
    return;
  }

  if (closePotButton) {
    state = core.updateRecruitmentStatus(state, closePotButton.dataset.closePot, '모집완료');
    showToast('모집을 마감했어요. 이제 정산 단계로 이어갈 수 있어요.');
    render();
    return;
  }

  if (manageButton) {
    const pot = potById(manageButton.dataset.manage);
    const waiting = (pot && pot.waitingParticipants) ? pot.waitingParticipants.length : 0;
    showToast(waiting ? `대기 중인 메이트가 ${waiting}명 있어요.` : '현재 대기 인원은 없어요.');
    return;
  }

  if (payButton) {
    const pot = potById(payButton.dataset.paySettlement);
    state = core.markParticipantPaid(state, payButton.dataset.paySettlement, state.user.id, pot.perPersonAmount);
    showToast(`내 몫 ${won(pot.perPersonAmount)} 결제가 반영됐어요.`);
    render();
  }
});

app.addEventListener('input', (event) => {
  if (event.target.id === 'search-input') {
    state.query = event.target.value;
    if (isSearchComposing) {
      return;
    }
    updateHomeSearchResults(event.target);
    return;
  }

  if (event.target.id === 'settlement-total') {
    state.settlementTotal = Number(event.target.value || 0);
    renderSettlement();
  }
});

app.addEventListener('compositionstart', (event) => {
  if (event.target.id === 'search-input') {
    isSearchComposing = true;
  }
});

app.addEventListener('compositionend', (event) => {
  if (event.target.id === 'search-input') {
    isSearchComposing = false;
    updateHomeSearchResults(event.target);
  }
});

app.addEventListener('change', (event) => {
  if (event.target.id === 'create-category') {
    state.createCategory = event.target.value;
    renderCreate();
    return;
  }

  if (event.target.id === 'radius-filter') {
    state.radiusFilter = Number(event.target.value || 500);
    renderHome({ animate: false });
    return;
  }

  if (event.target.id === 'sort-filter') {
    state.sortMode = event.target.value;
    renderHome({ animate: false });
  }
});

app.addEventListener('click', (event) => {
  const categoryButton = event.target.closest('[data-category]');
  if (!categoryButton) return;
  state.selectedCategory = categoryButton.dataset.category;
  renderHome({ animate: false });
});

app.addEventListener('submit', (event) => {
  if (event.target.id !== 'create-form') return;
  event.preventDefault();

  const formData = new FormData(event.target);
  const input = Object.fromEntries(formData.entries());
  const pot = core.createPot({
    ...input,
    host: { id: state.user.id, name: state.user.name, avatar: state.user.avatar, isMe: true },
    distanceMeters: 140,
    urgencyLabel: '새 모집',
    urgencyRank: 2,
    trustBadges: ['위치인증', '방장인증', '안전정산']
  });

  state.pots.unshift(pot);
  state.selectedPotId = pot.id;
  state.activeChatId = pot.id;
  state.chats[pot.id] = {
    potId: pot.id,
    notice: `${pot.category} 생성이 완료됐어요. 모집이 완료되면 이 방에서 정산을 이어갈 수 있어요.`,
    messages: [
      { from: 'system', text: '새 팟이 생성됐어요. 메이트 모집을 시작합니다.', type: 'system', system: true }
    ]
  };

  showToast('새 팟을 만들었어요. 상세에서 모집 정보를 바로 확인해 보세요.');
  setRoute('detail', pot.id);
});

render();
