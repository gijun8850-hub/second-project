(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PotMateCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const CATEGORY_FIELDS = {
    '배달팟': ['subCategory', 'menuHighlight', 'orderTime', 'pickupPoint'],
    '택시팟': ['subCategory', 'departurePoint', 'destination', 'departureTime', 'estimatedFare'],
    '구독팟': ['subCategory', 'serviceName', 'period', 'seatType'],
    '기타팟': ['subCategory', 'purpose', 'place', 'estimatedAmount']
  };

  const CATEGORY_DEFAULTS = {
    '배달팟': { joinRadiusMeters: 300, subCategory: '치킨' },
    '택시팟': { joinRadiusMeters: 500, subCategory: '귀가' },
    '구독팟': { joinRadiusMeters: 500, subCategory: 'OTT' },
    '기타팟': { joinRadiusMeters: 500, subCategory: '공동구매' }
  };

  const SETTLEMENT_STAGES = ['참여자 결제', '금액 보관', '서비스 이용 완료', '방장 정산 완료'];
  const SETTLEMENT_STAGE_INDEX = {
    '정산 대기': 0,
    '참여자 결제': 0,
    participant_payment: 0,
    '정산 요청됨': 1,
    funds_held: 1,
    '금액 보관': 1,
    service_complete: 2,
    '서비스 이용 완료': 2,
    '정산 완료': 3,
    host_settled: 3,
    payout_complete: 3,
    '방장 정산 완료': 3
  };
  const ESCROW_STAGE_BY_SETTLEMENT_STAGE = {
    '정산 대기': 'participant_payment',
    '정산 요청됨': 'funds_held',
    '정산 완료': 'host_settled',
    '참여자 결제': 'participant_payment',
    '금액 보관': 'funds_held',
    '서비스 이용 완료': 'service_complete',
    '방장 정산 완료': 'host_settled'
  };

  SETTLEMENT_STAGE_INDEX['정산 요청됨'] = 0;
  ESCROW_STAGE_BY_SETTLEMENT_STAGE['정산 요청됨'] = 'participant_payment';

  const SETTLEMENT_STAGE_BY_ESCROW_STAGE = {
    participant_payment: '참여자 결제',
    funds_held: '금액 보관',
    service_complete: '서비스 이용 완료',
    host_settled: '방장 정산 완료'
  };
  const PENDING_PAYMENT_STATUSES = new Set(['정산 요청됨', '참여중', '참여자 결제', '금액 보관', '서비스 이용 완료']);
  const COMPLETED_PAYMENT_STATUSES = new Set(['정산 완료', '방장 정산 완료', '충전 완료']);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatWon(amount) {
    return `${Number(amount || 0).toLocaleString('ko-KR')}원`;
  }

  function remainingSeats(pot) {
    return Math.max(Number(pot.maxMembers || 0) - Number(pot.currentMembers || 0), 0);
  }

  function normalizeRecruitStatus(pot) {
    if (Number(pot.currentMembers || 0) >= Number(pot.maxMembers || 0)) return '모집완료';
    if (remainingSeats(pot) <= 1) return '마감임박';
    return pot.recruitStatus || '모집중';
  }

  function searchTextFor(pot) {
    return [
      pot.title,
      pot.category,
      pot.subCategory,
      pot.locationSummary,
      pot.location,
      pot.description,
      pot.urgencyLabel,
      ...(pot.trustBadges || []),
      ...Object.values(pot.detail || {})
    ].filter(Boolean).join(' ').toLowerCase();
  }

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
      return items.sort((left, right) => {
        const leftRank = Number(left.urgencyRank || 99);
        const rightRank = Number(right.urgencyRank || 99);
        if (leftRank !== rightRank) return leftRank - rightRank;
        return Number(left.distanceMeters || 0) - Number(right.distanceMeters || 0);
      });
    }

    return items.sort((left, right) => {
      const distanceGap = Number(left.distanceMeters || 0) - Number(right.distanceMeters || 0);
      if (distanceGap !== 0) return distanceGap;
      return Number(left.urgencyRank || 99) - Number(right.urgencyRank || 99);
    });
  }

  function buildCategoryStats(pots) {
    return ['배달팟', '택시팟', '구독팟', '기타팟'].map((category) => {
      const items = pots.filter((pot) => pot.category === category && normalizeRecruitStatus(pot) !== '모집완료');
      return {
        category,
        count: items.length,
        closestDistance: items.length ? Math.min(...items.map((pot) => Number(pot.distanceMeters || 0))) : null
      };
    });
  }

  function buildHomeSections(pots, filters) {
    const visible = sortPots(filterPots(pots, filters), filters.sortMode || 'distance');
    const recommended = visible.filter((pot) => normalizeRecruitStatus(pot) !== '모집완료').slice(0, 3);
    const closingSoon = sortPots(
      visible.filter((pot) => normalizeRecruitStatus(pot) === '마감임박' || Number(pot.urgencyRank || 99) <= 2),
      'urgent'
    ).slice(0, 3);
    const categorySpotlights = ['배달팟', '택시팟', '구독팟', '기타팟']
      .map((category) => sortPots(pots.filter((pot) => pot.category === category), filters.sortMode || 'distance')[0])
      .filter(Boolean);

    return {
      visible,
      recommended,
      closingSoon,
      categorySpotlights,
      categoryStats: buildCategoryStats(filterPots(pots, { category: '전체', query: '', radius: filters.radius || 0 }))
    };
  }

  function buildTrustBadges(category, input) {
    const base = ['안전정산'];
    if (category === '배달팟' || category === '택시팟') base.unshift('위치인증');
    base.splice(1, 0, '방장인증');

    if (Array.isArray(input.trustBadges) && input.trustBadges.length) {
      return Array.from(new Set([...base, ...input.trustBadges]));
    }

    return base;
  }

  function buildVerificationSummary(verification) {
    if (verification && verification.status === 'verified' && verification.method === 'naver_student_id' && !verification.skipped) {
      return {
        badge: '네이버 학생증 인증 완료',
        headline: '검증된 캠퍼스 메이트',
        helper: '같은 학교 학생만 더 안전하게 연결할 수 있어요.'
      };
    }

    if (verification && verification.status === 'verified' && verification.method === 'school_email' && !verification.skipped) {
      return {
        badge: '학교 이메일 인증 완료',
        headline: '인증된 캠퍼스 메이트',
        helper: '학교 이메일을 확인한 학생들과 더 신뢰도 있게 연결할 수 있어요.'
      };
    }

    if (verification && verification.skipped) {
      return {
        badge: '인증은 나중에',
        headline: '둘러보기 모드로 시작했어요',
        helper: '원할 때 학생 인증을 마치고 더 안전한 거래 보호를 받을 수 있어요.'
      };
    }

    return {
      badge: '학생 인증 전',
      headline: '캠퍼스 메이트 인증 필요',
      helper: '학생 인증을 마치면 더 안전하게 팟을 만들고 참여할 수 있어요.'
    };
  }

  function normalizeEscrowStage(stageOrEscrow) {
    if (ESCROW_STAGE_BY_SETTLEMENT_STAGE[stageOrEscrow]) return ESCROW_STAGE_BY_SETTLEMENT_STAGE[stageOrEscrow];
    return stageOrEscrow || 'participant_payment';
  }

  function settlementStageFromEscrowStage(escrowStage) {
    return SETTLEMENT_STAGE_BY_ESCROW_STAGE[normalizeEscrowStage(escrowStage)] || SETTLEMENT_STAGE_BY_ESCROW_STAGE.participant_payment;
  }

  function syncSettlementStatus(next, potId, status) {
    next.settlements = (next.settlements || []).map((item) => (
      item.potId === potId
        ? { ...item, status }
        : item
    ));
  }

  function appendSystemMessage(next, pot, text) {
    next.chats = next.chats || {};
    next.chats[pot.id] = ensureChat(next.chats, pot);
    next.chats[pot.id].messages.push({
      from: 'system',
      type: 'system',
      text
    });
  }

  function buildDetail(category, input) {
    const detail = {};
    (CATEGORY_FIELDS[category] || []).forEach((field) => {
      if (input[field]) detail[field] = input[field];
    });
    return detail;
  }

  function buildTimeline(category) {
    if (category === '배달팟') {
      return [
        { label: '모집 시작', state: 'done' },
        { label: '주문 예정', state: 'current' },
        { label: '정산 완료', state: 'pending' }
      ];
    }
    if (category === '택시팟') {
      return [
        { label: '모집 시작', state: 'done' },
        { label: '출발 대기', state: 'current' },
        { label: '정산 완료', state: 'pending' }
      ];
    }
    if (category === '구독팟') {
      return [
        { label: '자리 모집', state: 'done' },
        { label: '정산 요청', state: 'current' },
        { label: '공유 시작', state: 'pending' }
      ];
    }

    return [
      { label: '모집 시작', state: 'done' },
      { label: '공동 진행', state: 'current' },
      { label: '정산 완료', state: 'pending' }
    ];
  }

  function createPot(input, idFactory) {
    const category = input.category || '기타팟';
    const defaults = CATEGORY_DEFAULTS[category] || CATEGORY_DEFAULTS['기타팟'];
    const host = input.host || { id: 'me', name: '민아', avatar: '민', isMe: true };

    const pot = {
      id: idFactory ? idFactory() : `pot-${Date.now()}`,
      category,
      subCategory: input.subCategory || defaults.subCategory,
      title: input.title || '새 팟',
      description: input.description || '근처 메이트를 빠르게 모아볼까요?',
      host,
      currentMembers: 1,
      maxMembers: Number(input.maxMembers || 4),
      participants: [
        { id: host.id, name: host.name, avatar: host.avatar || host.name[0], paid: true, isMe: Boolean(host.isMe) }
      ],
      waitingParticipants: [],
      perPersonAmount: Number(input.perPersonAmount || 0),
      distanceMeters: Number(input.distanceMeters || 120),
      joinRadiusMeters: Number(input.joinRadiusMeters || defaults.joinRadiusMeters),
      locationSummary: input.locationSummary || input.location || input.pickupPoint || input.departurePoint || input.place || '가천대 정문 근처',
      deadlineLabel: input.deadlineLabel || input.deadline || '오늘 22:00',
      recruitStatus: '모집중',
      settlementStage: '정산 대기',
      escrowStage: normalizeEscrowStage(input.escrowStage || input.settlementStage || 'participant_payment'),
      urgencyLabel: input.urgencyLabel || '모집 새로 시작',
      urgencyRank: Number(input.urgencyRank || 3),
      trustBadges: buildTrustBadges(category, input),
      detail: buildDetail(category, input),
      timeline: Array.isArray(input.timeline) && input.timeline.length ? clone(input.timeline) : buildTimeline(category)
    };

    pot.recruitStatus = normalizeRecruitStatus(pot);
    return pot;
  }

  function canJoinPot(pot, pointBalance, userDistance) {
    if (normalizeRecruitStatus(pot) === '모집완료') {
      return { ok: false, reason: '모집 인원이 모두 찼어요.' };
    }
    if (pot.recruitStatus && !['모집중', '마감임박'].includes(pot.recruitStatus) && normalizeRecruitStatus(pot) !== '마감임박') {
      return { ok: false, reason: '지금은 참여할 수 없는 모집 상태예요.' };
    }
    if (Number(userDistance || pot.distanceMeters || 0) > Number(pot.joinRadiusMeters || 0)) {
      return { ok: false, reason: '참여 가능 거리 밖에 있어요. 위치 인증 후 다시 시도해 주세요.' };
    }
    if (Number(pointBalance || 0) < Number(pot.perPersonAmount || 0)) {
      return { ok: false, reason: '포인트가 부족해요. 충전 후 참여해 주세요.' };
    }
    return { ok: true };
  }

  function ensureChat(chats, pot) {
    if (chats[pot.id]) return chats[pot.id];
    return {
      potId: pot.id,
      notice: `${pot.category} 진행 전 장소와 정산 금액을 다시 한 번 확인해 주세요.`,
      messages: [
        {
          from: 'system',
          type: 'system',
          text: `${pot.title} 채팅방이 열렸어요. 모집과 정산은 이 방에서 이어집니다.`
        }
      ]
    };
  }

  function sendChatMessage(state, potId, message) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;
    next.chats = next.chats || {};
    next.chats[potId] = ensureChat(next.chats, pot);
    next.chats[potId].messages.push(message);
    return next;
  }

  function updatePotStage(pot, stage) {
    pot.settlementStage = stage;
    pot.escrowStage = normalizeEscrowStage(stage);
    pot.timeline = buildSettlementStages(stage).map((item) => ({ label: item.label, state: item.state }));
  }

  function joinPot(state, potId) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;

    pot.participants = pot.participants || [];
    if (!pot.participants.some((member) => member.id === next.user.id)) {
      pot.participants.push({
        id: next.user.id,
        name: next.user.name,
        avatar: next.user.avatar || next.user.name[0],
        paid: false,
        isMe: true
      });
      pot.currentMembers += 1;
    }

    pot.recruitStatus = normalizeRecruitStatus(pot);
    next.activeChatId = potId;
    next.chats = next.chats || {};
    next.chats[potId] = ensureChat(next.chats, pot);
    next.chats[potId].messages.push({
      from: 'system',
      type: 'system',
      text: `${next.user.name}님이 참여했어요. 모집과 정산 흐름이 채팅방에 연결됩니다.`
    });

    next.payments = next.payments || [];
    next.payments.unshift({
      id: `pay-${Date.now()}`,
      potId,
      title: pot.title,
      category: pot.category,
      amount: Number(pot.perPersonAmount || 0),
      status: '참여중',
      date: '방금'
    });

    return next;
  }

  function upsertPayment(next, payment) {
    const existingIndex = (next.payments || []).findIndex((item) => item.potId === payment.potId && item.category === payment.category);
    if (existingIndex >= 0) {
      next.payments[existingIndex] = { ...next.payments[existingIndex], ...payment };
      return;
    }
    next.payments.unshift(payment);
  }

  function requestSettlement(state, potId, totalAmount) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;

    const participants = pot.participants && pot.participants.length ? pot.participants : [];
    const perPersonAmount = Math.ceil(Number(totalAmount || 0) / Math.max(participants.length, 1));

    pot.perPersonAmount = perPersonAmount;
    pot.participants = participants.map((member) => ({
      ...member,
      paid: member.id === pot.host.id
    }));
    pot.escrowStage = 'funds_held';
    updatePotStage(pot, '정산 요청됨');

    next.settlements = next.settlements || [];
    next.settlements.unshift({
      id: `settlement-${Date.now()}`,
      potId,
      title: pot.title,
      amount: perPersonAmount,
      totalAmount: Number(totalAmount || 0),
      status: '정산 요청됨',
      date: '방금'
    });

    next.payments = next.payments || [];
    if (pot.participants.some((member) => member.id === next.user.id && !member.paid)) {
      upsertPayment(next, {
        id: `payment-${Date.now()}`,
        potId,
        title: pot.title,
        category: pot.category,
        amount: perPersonAmount,
        status: '정산 요청됨',
        date: '방금'
      });
    }

    next.chats = next.chats || {};
    next.chats[potId] = ensureChat(next.chats, pot);
    next.chats[potId].messages.push({
      from: 'system',
      type: 'system',
      text: `정산 요청이 도착했어요. 1인당 ${formatWon(perPersonAmount)}씩 결제해 주세요.`
    });

    return next;
  }

  function sendReminder(name) {
    return `${name}님에게 리마인드 알림을 보냈어요. 아직 정산하지 않은 메이트가 있어요.`;
  }

  function markParticipantPaid(state, potId, participantId, amount) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;

    let deducted = false;
    pot.participants = (pot.participants || []).map((member) => {
      if (member.id !== participantId) return member;
      deducted = !member.paid;
      return { ...member, paid: true };
    });

    const totalAmount = Number(amount || pot.perPersonAmount || 0);
    if (participantId === next.user.id && deducted) {
      next.pointBalance = Math.max(Number(next.pointBalance || 0) - totalAmount, 0);
    }

    const allPaid = pot.participants.length > 0 && pot.participants.every((member) => member.paid);
    updatePotStage(pot, allPaid ? '정산 완료' : '정산 요청됨');

    next.payments = next.payments || [];
    upsertPayment(next, {
      id: `paid-${Date.now()}`,
      potId,
      title: pot.title,
      category: pot.category,
      amount: totalAmount,
      status: allPaid || participantId === next.user.id ? '정산 완료' : '정산 요청됨',
      date: '방금'
    });

    next.settlements = (next.settlements || []).map((item) => (
      item.potId === potId
        ? { ...item, status: allPaid ? '정산 완료' : '정산 요청됨' }
        : item
    ));

    next.chats = next.chats || {};
    next.chats[potId] = ensureChat(next.chats, pot);
    next.chats[potId].messages.push({
      from: 'system',
      type: 'system',
      text: allPaid
        ? '모든 메이트의 정산이 완료됐어요. 팟을 안전하게 마무리합니다.'
        : '정산 완료가 반영됐어요. 남은 메이트의 결제를 기다리고 있어요.'
    });

    return next;
  }

  function chargePoints(state, amount) {
    const next = clone(state);
    next.pointBalance = Number(next.pointBalance || 0) + Number(amount || 0);
    next.payments = next.payments || [];
    next.payments.unshift({
      id: `charge-${Date.now()}`,
      title: '포인트 충전',
      category: '포인트',
      amount: Number(amount || 0),
      status: '충전 완료',
      date: '방금'
    });
    return next;
  }

  function getPaymentHistory(state) {
    return clone(state.payments || []);
  }

  function buildWalletSections(state) {
    const payments = clone(state.payments || []);
    return {
      pending: payments.filter((item) => item.status === '정산 요청됨' || item.status === '참여중'),
      completed: payments.filter((item) => item.status === '정산 완료' || item.status === '충전 완료'),
      recent: payments
    };
  }

  function requestSettlement(state, potId, totalAmount) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;

    const participants = pot.participants && pot.participants.length ? pot.participants : [];
    const perPersonAmount = Math.ceil(Number(totalAmount || 0) / Math.max(participants.length, 1));
    const participantPaymentStage = settlementStageFromEscrowStage('participant_payment');

    pot.perPersonAmount = perPersonAmount;
    pot.participants = participants.map((member) => ({
      ...member,
      paid: member.id === pot.host.id
    }));
    updatePotStage(pot, participantPaymentStage);

    next.settlements = next.settlements || [];
    next.settlements.unshift({
      id: `settlement-${Date.now()}`,
      potId,
      title: pot.title,
      amount: perPersonAmount,
      totalAmount: Number(totalAmount || 0),
      status: participantPaymentStage,
      date: '방금'
    });

    next.payments = next.payments || [];
    if (pot.participants.some((member) => member.id === next.user.id && !member.paid)) {
      upsertPayment(next, {
        id: `payment-${Date.now()}`,
        potId,
        title: pot.title,
        category: pot.category,
        amount: perPersonAmount,
        status: participantPaymentStage,
        date: '방금'
      });
    }

    appendSystemMessage(next, pot, `정산 요청이 도착했어요. 1인당 ${formatWon(perPersonAmount)}씩 결제해 주세요.`);

    return next;
  }

  function markParticipantPaid(state, potId, participantId, amount) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;

    let deducted = false;
    pot.participants = (pot.participants || []).map((member) => {
      if (member.id !== participantId) return member;
      deducted = !member.paid;
      return { ...member, paid: true };
    });

    const totalAmount = Number(amount || pot.perPersonAmount || 0);
    if (participantId === next.user.id && deducted) {
      next.pointBalance = Math.max(Number(next.pointBalance || 0) - totalAmount, 0);
    }

    const allPaid = pot.participants.length > 0 && pot.participants.every((member) => member.paid);
    const nextStage = settlementStageFromEscrowStage(allPaid ? 'funds_held' : 'participant_payment');
    updatePotStage(pot, nextStage);

    next.payments = next.payments || [];
    upsertPayment(next, {
      id: `paid-${Date.now()}`,
      potId,
      title: pot.title,
      category: pot.category,
      amount: totalAmount,
      status: nextStage,
      date: '방금'
    });

    syncSettlementStatus(next, potId, nextStage);
    appendSystemMessage(
      next,
      pot,
      allPaid
        ? '모든 참여자의 결제가 완료되어 금액이 에스크로로 안전하게 보관 중이에요.'
        : '결제가 반영됐어요. 남은 참여자의 결제가 끝나면 금액이 안전하게 보관돼요.'
    );

    return next;
  }

  function advanceEscrowStage(state, potId, nextEscrowStage) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;

    const normalizedStage = normalizeEscrowStage(nextEscrowStage);
    const nextStage = settlementStageFromEscrowStage(normalizedStage);

    updatePotStage(pot, nextStage);
    syncSettlementStatus(next, potId, nextStage);
    next.payments = (next.payments || []).map((item) => (
      item.potId === potId
        ? { ...item, status: nextStage }
        : item
    ));

    appendSystemMessage(
      next,
      pot,
      normalizedStage === 'service_complete'
        ? '서비스 이용이 완료되어 방장이 최종 정산을 준비하고 있어요.'
        : '방장 정산 완료. 에스크로 보관 금액이 최종 정산까지 마무리됐어요.'
    );

    return next;
  }

  function buildWalletSections(state) {
    const payments = clone(state.payments || []);
    return {
      pending: payments.filter((item) => PENDING_PAYMENT_STATUSES.has(item.status)),
      completed: payments.filter((item) => COMPLETED_PAYMENT_STATUSES.has(item.status)),
      recent: payments
    };
  }

  function buildSettlementStages(currentStage) {
    const currentIndex = Math.max(
      Object.prototype.hasOwnProperty.call(SETTLEMENT_STAGE_INDEX, currentStage)
        ? SETTLEMENT_STAGE_INDEX[currentStage]
        : 0,
      0
    );
    return SETTLEMENT_STAGES.map((label, index) => ({
      label,
      state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending'
    }));
  }

  function updateRecruitmentStatus(state, potId, recruitStatus) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;
    pot.recruitStatus = recruitStatus;
    if (recruitStatus === '모집완료' && pot.currentMembers < pot.maxMembers) {
      pot.currentMembers = pot.maxMembers;
    }
    return next;
  }

  return {
    formatWon,
    filterPots,
    sortPots,
    buildHomeSections,
    buildCategoryStats,
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
    buildVerificationSummary,
    sendChatMessage,
    updateRecruitmentStatus
  };
});
