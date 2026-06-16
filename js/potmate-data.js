window.PotMateSeed = {
  hasSeenOnboarding: false,
  onboardingIndex: 0,
  authMode: 'student_verification',
  verification: {
    status: 'verified',
    method: 'naver_student_id',
    skipped: false
  },
  onboardingSlides: [
    {
      id: 'campus-nearby',
      title: '근처 학생들과 빠르게 팟을 만들어요',
      description: '캠퍼스 주변 메이트를 확인하고 바로 함께 주문하거나 이동할 수 있어요.'
    },
    {
      id: 'escrow-safe',
      title: '정산금은 맡겨두고 이용 후 정산해요',
      description: '참여자 결제 후 금액을 보관하고 서비스 이용이 끝나면 방장에게 정산해요.'
    }
  ],
  trustHighlights: [
    '네이버 학생증 인증 완료',
    '같은 학교 학생만 더 안전하게 연결',
    '에스크로 정산 단계로 거래 신뢰 강화'
  ],
  user: {
    id: 'me',
    name: '민아',
    avatar: '민',
    campus: '가천대학교',
    role: 'student',
    locationLabel: '비전타워 앞',
    verifiedDistanceMeters: 220
  },
  pointBalance: 28000,
  chargeOptions: [5000, 10000, 30000, 50000],
  activeChatId: 'pot-taxi-1',
  promoBanners: [
    {
      id: 'promo-food',
      label: '제휴 쿠폰',
      title: '배달팟 첫 참여 2,000원 할인',
      description: '오늘 23:59까지 사용 가능'
    }
  ],
  coupons: [
    {
      id: 'coupon-first',
      title: '첫 참여 할인',
      benefit: '2,000원 즉시 차감',
      appliesTo: '배달팟'
    },
    {
      id: 'coupon-cafe',
      title: '카페팟 전용 쿠폰',
      benefit: '1,000원 할인',
      appliesTo: '기타팟'
    }
  ],
  pots: [
    {
      id: 'pot-delivery-1',
      category: '배달팟',
      subCategory: '마라탕',
      title: '마라탕 같이 시켜요',
      description: '최소 주문금액 맞추고 비전타워 1층에서 바로 받아가요.',
      host: { id: 'host-1', name: '서휘', avatar: '서' },
      currentMembers: 3,
      maxMembers: 4,
      participants: [
        { id: 'host-1', name: '서휘', avatar: '서', paid: true },
        { id: 'mate-1', name: '지민', avatar: '지', paid: false },
        { id: 'mate-2', name: '유리', avatar: '유', paid: false }
      ],
      waitingParticipants: [],
      perPersonAmount: 12000,
      distanceMeters: 180,
      joinRadiusMeters: 300,
      locationSummary: '비전타워 1층 로비',
      deadlineLabel: '18분 후 마감',
      recruitStatus: '마감임박',
      settlementStage: '정산 대기',
      urgencyLabel: '1명 남음',
      urgencyRank: 1,
      trustBadges: ['위치인증', '방장인증', '안전정산'],
      detail: {
        subCategory: '마라탕',
        menuHighlight: '소고기 마라탕 + 꿔바로우',
        orderTime: '오늘 18:40',
        pickupPoint: '비전타워 1층 로비'
      },
      timeline: [
        { label: '모집 시작', state: 'done' },
        { label: '주문 예정', state: 'current' },
        { label: '정산 완료', state: 'pending' }
      ]
    },
    {
      id: 'pot-taxi-1',
      category: '택시팟',
      subCategory: '심야귀가',
      title: '강남역 11번 출구 택시팟',
      description: '정문 앞에서 만나 강남역까지 바로 이동해요. 출발 전에 정산 요청할게요.',
      host: { id: 'me', name: '민아', avatar: '민', isMe: true },
      currentMembers: 3,
      maxMembers: 4,
      participants: [
        { id: 'me', name: '민아', avatar: '민', paid: true, isMe: true },
        { id: 'mate-3', name: '도윤', avatar: '도', paid: false },
        { id: 'mate-4', name: '하린', avatar: '하', paid: false }
      ],
      waitingParticipants: [{ id: 'wait-1', name: '수빈', avatar: '수' }],
      perPersonAmount: 6500,
      distanceMeters: 120,
      joinRadiusMeters: 500,
      locationSummary: '정문 앞 택시 승강장',
      deadlineLabel: '27분 후 출발',
      recruitStatus: '모집중',
      settlementStage: '정산 대기',
      urgencyLabel: '한 자리 남음',
      urgencyRank: 2,
      trustBadges: ['위치인증', '방장인증', '안전정산'],
      detail: {
        subCategory: '심야귀가',
        departurePoint: '가천대 정문 앞',
        destination: '강남역 11번 출구',
        departureTime: '오늘 21:20',
        estimatedFare: '총 26,000원 예상'
      },
      timeline: [
        { label: '모집 시작', state: 'done' },
        { label: '출발 대기', state: 'current' },
        { label: '정산 완료', state: 'pending' }
      ]
    },
    {
      id: 'pot-sub-1',
      category: '구독팟',
      subCategory: 'OTT',
      title: '넷플릭스 프리미엄 4인팟',
      description: '이번 달 프리미엄 남은 자리 한 명 구해요. 정산 완료되면 바로 계정 공유해요.',
      host: { id: 'host-3', name: '유진', avatar: '유' },
      currentMembers: 3,
      maxMembers: 4,
      participants: [
        { id: 'host-3', name: '유진', avatar: '유', paid: true },
        { id: 'me', name: '민아', avatar: '민', paid: false, isMe: true },
        { id: 'mate-5', name: '준호', avatar: '준', paid: true }
      ],
      waitingParticipants: [],
      perPersonAmount: 4250,
      distanceMeters: 90,
      joinRadiusMeters: 500,
      locationSummary: '온라인 공유',
      deadlineLabel: '오늘 23:50 마감',
      recruitStatus: '모집중',
      settlementStage: '정산 요청됨',
      urgencyLabel: '정산 요청됨',
      urgencyRank: 3,
      trustBadges: ['방장인증', '안전정산'],
      detail: {
        subCategory: 'OTT',
        serviceName: '넷플릭스 프리미엄',
        period: '2026.05.01 - 2026.05.31',
        seatType: '4인 공유'
      },
      timeline: [
        { label: '자리 모집', state: 'done' },
        { label: '정산 요청됨', state: 'current' },
        { label: '공유 시작', state: 'pending' }
      ]
    },
    {
      id: 'pot-etc-1',
      category: '기타팟',
      subCategory: '공동구매',
      title: '시험기간 간식 공동구매',
      description: '쿠키랑 커피를 같이 주문해서 중앙도서관 라운지에서 나눠요.',
      host: { id: 'host-4', name: '채린', avatar: '채' },
      currentMembers: 5,
      maxMembers: 8,
      participants: [
        { id: 'host-4', name: '채린', avatar: '채', paid: true },
        { id: 'mate-6', name: '민재', avatar: '민', paid: false }
      ],
      waitingParticipants: [],
      perPersonAmount: 3000,
      distanceMeters: 460,
      joinRadiusMeters: 500,
      locationSummary: '중앙도서관 라운지',
      deadlineLabel: '내일 13:00 마감',
      recruitStatus: '모집중',
      settlementStage: '정산 대기',
      urgencyLabel: '시험기간 추천',
      urgencyRank: 4,
      trustBadges: ['위치인증', '방장인증', '안전정산'],
      detail: {
        subCategory: '공동구매',
        purpose: '시험기간 간식 공동구매',
        place: '중앙도서관 라운지',
        estimatedAmount: '총 24,000원 예상'
      },
      timeline: [
        { label: '모집 시작', state: 'done' },
        { label: '공동 구매', state: 'current' },
        { label: '정산 완료', state: 'pending' }
      ]
    }
  ],
  chats: {
    'pot-delivery-1': {
      potId: 'pot-delivery-1',
      notice: '비전타워 1층 로비에서 만나고, 정산은 주문 직후 안전결제로 요청할게요.',
      messages: [
        { from: 'host-1', name: '서휘', text: '마라탕은 2단계로 주문할게요.', type: 'host' },
        { from: 'mate-1', name: '지민', text: '좋아요. 꿔바로우도 같이 먹고 싶어요.', type: 'member' }
      ]
    },
    'pot-taxi-1': {
      potId: 'pot-taxi-1',
      notice: '정문 앞 택시 승강장에서 만나면 출발 전에 정산 요청 보낼게요.',
      messages: [
        { from: 'me', name: '민아', text: '21시 20분에 정문 앞에서 출발할게요.', type: 'mine', mine: true },
        { from: 'mate-3', name: '도윤', text: '도착하면 채팅 남길게요.', type: 'member' }
      ]
    },
    'pot-sub-1': {
      potId: 'pot-sub-1',
      notice: '정산 완료되면 바로 계정 초대 링크 보낼게요.',
      messages: [
        { from: 'system', text: '정산 요청이 도착했어요. 1인당 4,250원을 결제해 주세요.', type: 'system', system: true },
        { from: 'host-3', name: '유진', text: '정산 끝나면 프로필 공유해드릴게요.', type: 'host' }
      ]
    }
  },
  settlements: [
    { id: 'set-1', potId: 'pot-sub-1', title: '넷플릭스 프리미엄 4인팟', amount: 4250, status: '정산 요청됨', date: '오늘' }
  ],
  payments: [
    { id: 'charge-1', title: '포인트 충전', category: '포인트', amount: 10000, status: '충전 완료', date: '오늘' },
    { id: 'pay-1', potId: 'pot-sub-1', title: '넷플릭스 프리미엄 4인팟', category: '구독팟', amount: 4250, status: '정산 요청됨', date: '오늘' },
    { id: 'pay-2', potId: 'old-delivery-1', title: '치킨 배달팟', category: '배달팟', amount: 9800, status: '정산 완료', date: '어제' }
  ]
};
