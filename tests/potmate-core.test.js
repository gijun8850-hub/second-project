const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  filterPots,
  sortPots,
  buildHomeSections,
  createPot,
  canJoinPot,
  joinPot,
  requestSettlement,
  sendReminder,
  chargePoints,
  markParticipantPaid,
  advanceEscrowStage,
  getPaymentHistory,
  buildWalletSections,
  buildSettlementStages,
  buildVerificationSummary
} = require('../js/potmate-core.js');

function loadPotMateSeed() {
  const source = fs.readFileSync(path.join(__dirname, '../js/potmate-data.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.PotMateSeed;
}

function normalizeJson(value) {
  return JSON.parse(JSON.stringify(value));
}

const pots = [
  {
    id: 'pot-delivery-near',
    title: '마라탕 같이 시켜요',
    category: '배달팟',
    subCategory: '마라탕',
    locationSummary: '비전타워 1층',
    description: '최소 주문금액 맞추고 바로 주문해요.',
    distanceMeters: 180,
    joinRadiusMeters: 300,
    urgencyRank: 1,
    currentMembers: 3,
    maxMembers: 4,
    perPersonAmount: 12000,
    recruitStatus: '모집중',
    settlementStage: '정산 대기',
    detail: { orderTime: '오늘 18:40' }
  },
  {
    id: 'pot-taxi-near',
    title: '강남역 택시팟',
    category: '택시팟',
    subCategory: '심야귀가',
    locationSummary: '정문 앞',
    description: '같이 타고 강남역까지 가요.',
    distanceMeters: 120,
    joinRadiusMeters: 500,
    urgencyRank: 2,
    currentMembers: 2,
    maxMembers: 4,
    perPersonAmount: 6500,
    recruitStatus: '모집중',
    settlementStage: '정산 대기',
    detail: { destination: '강남역 11번 출구' }
  },
  {
    id: 'pot-subscription',
    title: '넷플릭스 프리미엄 4인팟',
    category: '구독팟',
    subCategory: 'OTT',
    locationSummary: '온라인',
    description: '이번 달 프리미엄 같이 써요.',
    distanceMeters: 90,
    joinRadiusMeters: 500,
    urgencyRank: 3,
    currentMembers: 3,
    maxMembers: 4,
    perPersonAmount: 4250,
    recruitStatus: '모집중',
    settlementStage: '정산 요청됨',
    detail: { serviceName: '넷플릭스' }
  },
  {
    id: 'pot-etc-far',
    title: '시험기간 간식 공동구매',
    category: '기타팟',
    subCategory: '공동구매',
    locationSummary: '중앙도서관 라운지',
    description: '쿠키랑 커피 같이 사요.',
    distanceMeters: 520,
    joinRadiusMeters: 500,
    urgencyRank: 4,
    currentMembers: 5,
    maxMembers: 8,
    perPersonAmount: 3000,
    recruitStatus: '모집중',
    settlementStage: '정산 대기',
    detail: { place: '중앙도서관 라운지' }
  }
];

test('filterPots applies category, query, and radius filtering together', () => {
  const result = filterPots(pots, { category: '배달팟', query: '마라', radius: 300 });
  assert.deepEqual(result.map((pot) => pot.id), ['pot-delivery-near']);
});

test('sortPots supports distance and urgency ordering', () => {
  assert.deepEqual(sortPots(pots, 'distance').map((pot) => pot.id), [
    'pot-subscription',
    'pot-taxi-near',
    'pot-delivery-near',
    'pot-etc-far'
  ]);

  assert.deepEqual(sortPots(pots, 'urgent').map((pot) => pot.id), [
    'pot-delivery-near',
    'pot-taxi-near',
    'pot-subscription',
    'pot-etc-far'
  ]);
});

test('buildHomeSections returns recommended, closing-soon, and category spotlight collections', () => {
  const sections = buildHomeSections(pots, { category: '전체', query: '', radius: 500, sortMode: 'distance' });
  assert.equal(sections.recommended.length, 3);
  assert.equal(sections.closingSoon.length >= 2, true);
  assert.equal(sections.categorySpotlights.length, 4);
});

test('canJoinPot blocks joins outside the allowed radius and when points are insufficient', () => {
  assert.deepEqual(canJoinPot(pots[0], 25000, 620), {
    ok: false,
    reason: '참여 가능 거리 밖에 있어요. 위치 인증 후 다시 시도해 주세요.'
  });

  assert.deepEqual(canJoinPot(pots[0], 4000, 180), {
    ok: false,
    reason: '포인트가 부족해요. 충전 후 참여해 주세요.'
  });
});

test('createPot normalizes trust badges, category detail, and default recruitment state', () => {
  const pot = createPot(
    {
      category: '구독팟',
      title: '넷플릭스 4인팟',
      serviceName: '넷플릭스',
      period: '30일',
      host: { id: 'me', name: '민아', avatar: '민', isMe: true }
    },
    () => 'new-pot'
  );

  assert.equal(pot.id, 'new-pot');
  assert.equal(pot.recruitStatus, '모집중');
  assert.equal(pot.settlementStage, '정산 대기');
  assert.equal(pot.escrowStage, 'participant_payment');
  assert.equal(pot.joinRadiusMeters, 500);
  assert.ok(pot.trustBadges.includes('안전정산'));
  assert.equal(pot.detail.serviceName, '넷플릭스');
});

test('joinPot adds the current user and closes recruitment when the last seat is taken', () => {
  const state = {
    user: { id: 'me', name: '민아', avatar: '민' },
    pots: [
      {
        ...pots[0],
        participants: [
          { id: 'host-1', name: '서휘', avatar: '서', paid: true },
          { id: 'mate-1', name: '지민', avatar: '지', paid: false },
          { id: 'mate-2', name: '유리', avatar: '유', paid: false }
        ]
      }
    ],
    chats: {},
    payments: []
  };

  const next = joinPot(state, 'pot-delivery-near');

  assert.equal(next.pots[0].currentMembers, 4);
  assert.equal(next.pots[0].recruitStatus, '모집완료');
  assert.equal(next.pots[0].participants.some((member) => member.id === 'me'), true);
  assert.equal(next.payments[0].status, '참여중');
});

test('requestSettlement computes per-person payment and emits a system message', () => {
  const state = {
    user: { id: 'me', name: '민아' },
    pots: [
      {
        ...pots[1],
        host: { id: 'host-2', name: '민호', avatar: '민' },
        participants: [
          { id: 'host-2', name: '민호', avatar: '민', paid: true },
          { id: 'me', name: '민아', avatar: '민', paid: false },
          { id: 'mate-3', name: '도윤', avatar: '도', paid: false }
        ]
      }
    ],
    chats: { 'pot-taxi-near': { potId: 'pot-taxi-near', messages: [] } },
    settlements: [],
    payments: []
  };

  const next = requestSettlement(state, 'pot-taxi-near', 27000);

  assert.equal(next.pots[0].settlementStage, '참여자 결제');
  assert.equal(next.pots[0].escrowStage, 'participant_payment');
  assert.equal(next.pots[0].perPersonAmount, 9000);
  assert.equal(next.settlements[0].amount, 9000);
  assert.equal(next.settlements[0].status, '참여자 결제');
  assert.equal(next.payments[0].status, '참여자 결제');
  assert.match(next.chats['pot-taxi-near'].messages.at(-1).text, /정산 요청/);
});

test('requestSettlement keeps 참여자 결제 active until every participant has paid', () => {
  const state = {
    user: { id: 'me', name: '민아' },
    pots: [
      {
        ...pots[1],
        host: { id: 'host-2', name: '민호', avatar: '민' },
        participants: [
          { id: 'host-2', name: '민호', avatar: '민', paid: true },
          { id: 'me', name: '민아', avatar: '민', paid: false },
          { id: 'mate-3', name: '지윤', avatar: '지', paid: false }
        ]
      }
    ],
    chats: { 'pot-taxi-near': { potId: 'pot-taxi-near', messages: [] } },
    settlements: [],
    payments: []
  };

  const next = requestSettlement(state, 'pot-taxi-near', 27000);

  assert.equal(next.pots[0].settlementStage, '참여자 결제');
  assert.equal(next.pots[0].escrowStage, 'participant_payment');
  assert.equal(next.settlements[0].status, '참여자 결제');
  assert.equal(next.payments[0].status, '참여자 결제');
});

test('advanceEscrowStage moves from 금액 보관 to 서비스 이용 완료 to terminal host_settled', () => {
  const state = {
    user: { id: 'me', name: '민아' },
    pots: [
      {
        ...pots[1],
        host: { id: 'me', name: '민아', avatar: '민', isMe: true },
        settlementStage: '금액 보관',
        escrowStage: 'funds_held',
        participants: [
          { id: 'me', name: '민아', avatar: '민', paid: true, isMe: true },
          { id: 'mate-3', name: '지윤', avatar: '지', paid: true },
          { id: 'mate-4', name: '하람', avatar: '하', paid: true }
        ]
      }
    ],
    chats: { 'pot-taxi-near': { potId: 'pot-taxi-near', messages: [] } },
    settlements: [{ id: 'set-1', potId: 'pot-taxi-near', status: '금액 보관', amount: 9000 }],
    payments: [{ id: 'pay-1', potId: 'pot-taxi-near', status: '금액 보관', amount: 9000, title: '강남역 택시팟', category: '택시팟', date: '오늘' }]
  };

  const serviceComplete = advanceEscrowStage(state, 'pot-taxi-near', 'service_complete');
  assert.equal(serviceComplete.pots[0].settlementStage, '서비스 이용 완료');
  assert.equal(serviceComplete.pots[0].escrowStage, 'service_complete');
  assert.equal(serviceComplete.settlements[0].status, '서비스 이용 완료');

  const hostSettled = advanceEscrowStage(serviceComplete, 'pot-taxi-near', 'host_settled');
  assert.equal(hostSettled.pots[0].settlementStage, '방장 정산 완료');
  assert.equal(hostSettled.pots[0].escrowStage, 'host_settled');
  assert.equal(hostSettled.settlements[0].status, '방장 정산 완료');
  assert.equal(hostSettled.payments[0].status, '방장 정산 완료');
  assert.match(hostSettled.chats['pot-taxi-near'].messages.at(-1).text, /방장 정산 완료/);
});

test('sendReminder returns the expected toast copy for unpaid participants', () => {
  assert.equal(
    sendReminder('지민'),
    '지민님에게 리마인드 알림을 보냈어요. 아직 정산하지 않은 메이트가 있어요.'
  );
});

test('markParticipantPaid deducts balance for the current user and completes settlement when everyone is done', () => {
  const state = {
    user: { id: 'me', name: '민아' },
    pointBalance: 28000,
    pots: [
      {
        ...pots[2],
        participants: [
          { id: 'host-3', name: '유진', paid: true },
          { id: 'me', name: '민아', paid: false }
        ]
      }
    ],
    settlements: [{ id: 'set-1', potId: 'pot-subscription', status: '정산 요청됨', amount: 4250 }],
    payments: [{ id: 'pay-1', potId: 'pot-subscription', amount: 4250, status: '정산 요청됨', title: '넷플릭스 프리미엄 4인팟', category: '구독팟', date: '오늘' }]
  };

  const next = markParticipantPaid(state, 'pot-subscription', 'me', 4250);

  assert.equal(next.pointBalance, 23750);
  assert.equal(next.pots[0].settlementStage, '금액 보관');
  assert.equal(next.pots[0].escrowStage, 'funds_held');
  assert.equal(next.payments[0].status, '금액 보관');
  assert.equal(next.settlements[0].status, '금액 보관');
});

test('chargePoints increases balance and prepends a completed charge history item', () => {
  const next = chargePoints({ pointBalance: 18000, payments: [] }, 10000);

  assert.equal(next.pointBalance, 28000);
  assert.equal(getPaymentHistory(next)[0].status, '충전 완료');
});

test('buildWalletSections groups pending, completed, and recent history', () => {
  const sections = buildWalletSections({
    payments: [
      { id: 'charge-1', status: '충전 완료', amount: 10000 },
      { id: 'pay-1', status: '정산 요청됨', amount: 4250 },
      { id: 'pay-2', status: '정산 완료', amount: 9800 },
      { id: 'pay-3', status: '참여중', amount: 6500 }
    ]
  });

  assert.equal(sections.pending.length, 2);
  assert.equal(sections.completed.length, 2);
  assert.equal(sections.recent[0].id, 'charge-1');
});

test('buildSettlementStages marks the current progress correctly', () => {
  const stages = buildSettlementStages('정산 요청됨');
  assert.deepEqual(stages.map((stage) => stage.label), [
    '참여자 결제',
    '금액 보관',
    '서비스 이용 완료',
    '방장 정산 완료'
  ]);
  assert.deepEqual(stages.map((stage) => stage.state), ['current', 'pending', 'pending', 'pending']);
});

test('buildSettlementStages accepts the escrowStage source-of-truth key', () => {
  const stages = buildSettlementStages('funds_held');
  assert.deepEqual(stages.map((stage) => stage.state), ['done', 'current', 'pending', 'pending']);
});

test('buildSettlementStages accepts the terminal escrowStage key', () => {
  const stages = buildSettlementStages('host_settled');
  assert.deepEqual(stages.map((stage) => stage.state), ['done', 'done', 'done', 'current']);
});

test('buildVerificationSummary returns the verified naver student trust copy', () => {
  assert.deepEqual(
    buildVerificationSummary({ status: 'verified', method: 'naver_student_id', skipped: false }),
    {
      badge: '네이버 학생증 인증 완료',
      headline: '검증된 캠퍼스 메이트',
      helper: '같은 학교 학생만 더 안전하게 연결할 수 있어요.'
    }
  );
});

test('buildVerificationSummary returns the verified school email trust copy', () => {
  assert.deepEqual(
    buildVerificationSummary({ status: 'verified', method: 'school_email', skipped: false }),
    {
      badge: '학교 이메일 인증 완료',
      headline: '인증된 캠퍼스 메이트',
      helper: '학교 이메일을 확인한 학생들과 더 신뢰도 있게 연결할 수 있어요.'
    }
  );
});

test('buildVerificationSummary returns the skipped verification copy', () => {
  assert.deepEqual(
    buildVerificationSummary({ status: 'unverified', method: null, skipped: true }),
    {
      badge: '인증은 나중에',
      headline: '둘러보기 모드로 시작했어요',
      helper: '원할 때 학생 인증을 마치고 더 안전한 거래 보호를 받을 수 있어요.'
    }
  );
});

test('buildVerificationSummary returns the default unverified copy', () => {
  assert.deepEqual(
    buildVerificationSummary({ status: 'unverified', method: null, skipped: false }),
    {
      badge: '학생 인증 전',
      headline: '캠퍼스 메이트 인증 필요',
      helper: '학생 인증을 마치면 더 안전하게 팟을 만들고 참여할 수 있어요.'
    }
  );
});

test('PotMateSeed uses the approved auth defaults and onboarding trust copy', () => {
  const seed = loadPotMateSeed();

  assert.equal(seed.authMode, 'login');
  assert.deepEqual(normalizeJson(seed.verification), { status: 'unverified', method: null, skipped: false });
  assert.equal(seed.onboardingSlides.length, 3);
  assert.deepEqual(normalizeJson(seed.onboardingSlides[0]), {
    title: '같이 N빵할 사람 구해요',
    description: '배달, 택시, 구독까지 캠퍼스 메이트와 함께 나누고 더 가볍게 이용하세요.',
    graphic: 'categories'
  });
  assert.deepEqual(normalizeJson(seed.onboardingSlides[1]), {
    title: '근처 대학생과 쉽고 빠르게',
    description: '위치 기반 매칭으로 내 주변 대학생들과 안전하게 연결됩니다.',
    graphic: 'campus-map'
  });
  assert.deepEqual(normalizeJson(seed.onboardingSlides[2]), {
    title: '모집부터 정산까지 한 번에',
    description: '채팅, 정산, 네이버페이 결제까지 앱 안에서 모두 해결하세요.',
    graphic: 'recruit-chat-pay'
  });
  assert.equal(seed.trustHighlights[0], '네이버 학생증으로 대학생 인증');
  assert.equal(seed.trustHighlights[1], '위치 기반으로 내 주변 학생 연결');
  assert.equal(seed.trustHighlights[2], '정산 전 금액 보관으로 더 안전한 거래');
});
