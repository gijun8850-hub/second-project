# PotMate Auth And Trust UX Design

## Goal

Strengthen the PotMate demo so the entry flow feels like a believable student product rather than a simple static prototype. The user should understand the service quickly, move naturally into login or signup, see a realistic student-verification step, and feel trust around settlement without any real external authentication or payment integration.

## Product Intent

This phase improves first-run understanding and service credibility.

The demo should communicate four things clearly:

1. PotMate helps students split delivery, taxi, subscription, and other shared costs.
2. Matching is campus-oriented and student-focused.
3. Identity and participation are trust-aware, even in a static demo.
4. Settlement is protected and guided through a clear escrow-style flow.

The experience should feel realistic, but it must remain a deterministic front-end demo.

## Scope

Included:

- new 3-page onboarding carousel
- login and signup in one tabbed auth screen
- separate student verification screen after signup
- optional verification flow with `skip for now`
- escrow trust badges across payment and settlement touchpoints
- stronger settlement progress visualization
- trust messaging distributed across key screens

Explicitly out of scope:

- real Naver student ID integration
- real school email verification
- real account creation or backend persistence
- real payment or escrow infrastructure
- real Naver Pay integration

All of these should be represented through realistic UI states, simulated transitions, and believable product copy only.

## UX Principles

### 1. Explain first, then ask for commitment

Users should understand the product before being asked to log in or sign up. Onboarding must establish the value of splitting costs with nearby students and make the app feel immediately useful.

### 2. Realistic, not overbuilt

The auth and verification flow should look like a real service, but should avoid fake complexity. A few high-quality states and screens are more convincing than a large number of shallow controls.

### 3. Trust should be ambient

Trust should not live in one isolated screen. Verification, escrow messaging, and protected settlement cues should appear naturally across onboarding, auth, detail, chat, settlement, and wallet views.

### 4. Progress should always be legible

The user should always know where they are in the flow:

- onboarding progress
- login vs signup state
- verification status
- settlement progress

## User Flow

The recommended entry flow is:

`Onboarding (3 pages) -> Login / Signup tabs -> Signup completes -> Student Verification screen -> Home`

Verification is optional in the sense that the user may choose `skip for now`, but trust-gated participation or settlement moments may remind them to complete it later.

The login path is:

`Onboarding (3 pages) -> Login / Signup tabs -> Login -> Home`

This keeps the flow short for returning users while making signup and trust-building feel intentional for new users.

## Information Architecture

### 1. Three-page onboarding

Purpose:

- explain the service quickly
- establish campus relevance
- introduce trust and payment continuity
- transition directly into auth

#### Onboarding page 1

Title:

`같이 N빵할 사람 구해요`

Description:

`배달, 택시, 구독까지 캠퍼스 메이트와 함께 나누고 더 가볍게 이용하세요.`

Visual direction:

- friendly category illustration
- delivery, taxi, and subscription cues
- bright and casual tone

#### Onboarding page 2

Title:

`근처 대학생과 쉽고 빠르게`

Description:

`위치 기반 매칭으로 내 주변 대학생들과 안전하게 연결됩니다.`

Visual direction:

- map or campus matching graphic
- nearby connection emphasis

#### Onboarding page 3

Title:

`모집부터 정산까지 한 번에`

Description:

`채팅, 정산, 네이버페이 결제까지 앱 안에서 모두 해결하세요.`

Visual direction:

- simple `recruit -> chat -> settlement` flow
- payment continuity cues

CTA:

- `시작하기`

Behavior:

- page indicators
- horizontal pager or step-based next flow
- final CTA routes to the auth screen

### 2. Login and signup screen

Purpose:

- support both returning and new users without unnecessary screen switching
- feel like a real product entry point

Structure:

- one screen with two top tabs:
  - `로그인`
  - `회원가입`

#### Login tab

Fields:

- `학교 이메일 또는 아이디`
- `비밀번호`

Controls:

- `자동 로그인`
- `비밀번호 보기`
- `아이디/비밀번호 찾기`

CTAs:

- primary: `로그인`
- secondary: `카카오로 시작하기`

Behavior:

- disabled primary button until fields are valid
- lightweight error and success feedback
- successful login routes to home

#### Signup tab

Fields:

- `학교 이메일`
- `닉네임`
- `비밀번호`
- `비밀번호 확인`

Agreement area:

- service terms
- privacy collection
- location-based service agreement

CTA:

- `회원가입 후 인증하기`

Support copy:

- `같은 학교 학생만 참여할 수 있어요`
- `가입 후 대학생 인증으로 더 안전하게 이용할 수 있어요`

Behavior:

- disabled CTA until required fields are valid
- email format validation
- password mismatch validation
- successful signup routes to the student verification screen

### 3. Student verification screen

Purpose:

- strengthen the feeling of a trusted campus-only network
- create a believable verification checkpoint without real third-party integration

Headline:

- `검증된 캠퍼스 메이트로 시작하세요`

Support copy:

- `같은 학교 학생만 더 안전하게 연결할 수 있어요`
- `인증 후 팟 참여와 정산을 더 신뢰 있게 이용할 수 있어요`

#### Primary verification option

Main card:

- `네이버 학생증 인증`

Role:

- visually dominant
- positioned as the recommended option

CTA:

- `학생증 인증하기`

Support copy:

- `네이버 학생증으로 빠르게 인증`
- `검증된 캠퍼스 메이트 배지를 받을 수 있어요`

#### Secondary verification option

Secondary card:

- `학교 이메일 인증`

CTA:

- `이메일로 인증하기`

Support copy:

- `학교 이메일로 인증 링크 받기`

#### Verification states

Each option can show:

- `인증 전`
- `인증 진행 중`
- `인증 완료`

#### Bottom actions

- `나중에 하기`
- `홈으로 이동` after completion

Rules:

- verification is not mandatory for entering home
- later participation, trust-focused surfaces, or settlement can remind the user to complete it

### 4. Trust and safety reinforcement across the app

Purpose:

- make credibility feel systemic rather than decorative

Trust cues should appear in these forms:

- status pills
- compact trust cards
- contextual notices
- participant or host badges

Key trust messages:

- `네이버 학생증 인증 완료`
- `검증된 캠퍼스 메이트`
- `에스크로 안전 정산`
- `네이버페이 포인트 적립`

Placement:

- home summary or highlight area
- pot detail trust area
- chat room notice area
- settlement screen header or badge section
- My Payments overview area

## Safety Payment UX

All payment and settlement surfaces should include escrow-focused language.

Recommended UI treatments:

- badge: `안전결제`
- helper text: `에스크로 기반으로 정산금이 보호되고 있어요`
- alternate compact state: `에스크로 안전 정산 진행 중`

Surfaces that should include this:

- pot detail
- chat settlement card
- settlement status screen
- My Payments wallet or payment history surfaces

The tone should suggest protected money flow without pretending a real gateway is active.

## Settlement Progress Visualization

The settlement screen should gain a stronger progress component at the top.

Required steps:

1. `참여자 결제`
2. `금액 보관`
3. `서비스 이용 완료`
4. `방장 정산 완료`

UI direction:

- horizontal stepper
- current step highlighted in `#AA01E7`
- completed steps with check state
- pending steps in soft muted tones

This is distinct from the lower participant-by-participant status list. The stepper explains the overall escrow flow, while the list explains who has paid.

## Content Strategy

This phase should use product language that feels safe and realistic but does not falsely imply real regulated financial operations.

Preferred phrases:

- `안전 정산 플로우`
- `에스크로 기반 보호`
- `인증 기반 참여 신뢰`
- `포인트 적립 예정`
- `검증된 캠퍼스 메이트`

Avoid language that suggests real external verification has occurred unless the demo state explicitly shows a completed simulated step.

## Visual Direction

Keep the existing PotMate visual system:

- main: `#AA01E7`
- soft: `#F8E7FE`
- pale purple and white gradients
- rounded mobile-first cards
- bright, clean, campus-friendly atmosphere

New additions should feel consistent with the current demo rather than like a separate product.

Specific visual guidance:

- onboarding illustrations should be lightweight and friendly
- auth tabs should feel compact and clean
- verification cards should feel reassuring and slightly more premium
- trust badges should be readable, not noisy
- stepper should be visually strong but simple

## State Model Expectations

The front-end state model should simulate:

- whether onboarding has been completed
- whether the auth screen is on login or signup mode
- whether signup is complete
- whether verification is not started, in progress, skipped, or complete
- whether a user should see trust reminders on later screens

This should remain deterministic and local, with no dependency on real APIs.

## Testing Requirements

Implementation planning should cover:

- onboarding page progression and final CTA routing
- login and signup tab switching
- signup validation and route to verification
- verification state transitions and skip path
- trust badge rendering on key screens
- settlement stepper rendering and current-step state
- preservation of existing home, chat, settlement, and wallet flows

## Recommended Implementation Strategy

Build this in one coherent pass across four areas:

1. entry flow state and routing
2. auth and signup UI
3. student verification UI and state
4. trust and settlement visual reinforcement

This keeps the product narrative consistent and avoids partially upgrading one entry point without the rest of the trust system.
