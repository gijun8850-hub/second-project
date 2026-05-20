# PotMate Balanced Demo Design

## Goal

Build a GitHub Pages-friendly mobile web demo for `PotMate`, a location-based split-payment platform for college students. The demo should feel like a believable service product, not a static marketing mockup, and should let a user experience the core flow from nearby pot discovery through safe settlement.

## Product Intent

PotMate is not just a community board. It is a single in-app flow that unifies:

1. finding nearby people for a shared expense
2. joining or creating a pot
3. coordinating inside a chat room
4. requesting and completing safe settlement with points

The product should communicate speed, trust, and continuity. Users should feel that discovery, coordination, and payment belong to one system rather than a collection of disconnected screens.

## Scope

This implementation targets a high-fidelity static demo.

Included:

- onboarding
- location-based home exploration
- pot detail and join decision flow
- pot creation flow
- chat room with host/system/payment context
- settlement status screen
- My Payments wallet view
- realistic dummy data across delivery, taxi, subscription, and other categories
- page transition and app-like interaction feedback
- self-contained GitHub Pages output from `index.html`

Explicitly out of scope for this phase:

- real geolocation APIs
- real-time networking
- actual payment gateway integration
- backend persistence
- authentication

All of those should be simulated through deterministic front-end state transitions.

## Recommended Product Structure

The demo should follow a `hub-first balanced` structure.

- The home screen is the primary discovery hub.
- All four categories are visible and feel equally intentional.
- The downstream flow stays consistent across categories:
  `Home -> Detail -> Join -> Chat -> Settlement -> My Payments`
- Category-specific differences come from card content, detail fields, status copy, and settlement context rather than from completely separate screen architectures.

This keeps the product easy to understand while still showing breadth.

## UX Principles

### 1. One-flow continuity

Every major action should feel connected. Joining a pot should naturally hand off to chat. Settlement should naturally hand off to wallet status. The user should not feel dropped into disconnected utilities.

### 2. High scanability

Home cards must surface the main decision inputs at a glance:

- category
- distance
- remaining seats
- expected amount
- urgency
- safe settlement availability

### 3. Trust over abstraction

Because the product touches money and meetup coordination, trust cues should be visible on all critical screens:

- location verification
- host verification
- safe settlement
- clear progress states

### 4. Student-first tone

The product should feel bright, fast, trendy, and casual without becoming toy-like. It should resemble a polished campus utility app rather than a finance dashboard or a generic social feed.

## Visual Direction

### Layout

- mobile-app-first shell
- responsive but strongly phone-shaped composition
- generous card spacing
- layered card depth with bright highlights
- rounded geometry

### Color system

- main: `#AA01E7`
- soft: `#F8E7FE`
- bright white and pale purple gradients
- no dark mode requirement for this demo

### Component feel

- glossy but readable cards
- pill badges for trust and status
- strong CTA buttons
- soft shadowed chat bubbles
- finance-style summary cards in My Payments

### Chat styling requirements

- clear left/right message alignment
- visible participant profile markers
- host badge on host messages
- breathing room between messages
- system messages visually distinct from human messages

## Information Architecture

### 1. Onboarding

Purpose:

- explain the service in one glance
- establish nearby discovery + safe settlement value
- transition quickly into the product

Key content:

- short hero copy
- nearby pot preview
- safe settlement preview
- single start CTA

### 2. Home Hub

Purpose:

- balanced discovery across four categories
- quick filtering and scroll-first exploration

Key sections:

- current location summary
- points snapshot
- category tabs
- search
- radius and sorting controls
- recommended pots
- urgent closing pots
- coupon or partner banner slot

Each pot card should include:

- category
- title
- current / max members
- expected per-person amount
- distance
- deadline or urgency
- trust badges
- direct participation CTA

### 3. Pot Detail

Purpose:

- help the user decide whether to join

Required content:

- category badge
- title and description
- host info
- participant preview
- location restriction
- expected amount
- deadline
- category-specific detail rows
- trust badges

Category-specific examples:

- delivery: food subcategory, order time, pickup point
- taxi: departure point, destination, departure time, estimated total fare
- subscription: service name, period, seat structure
- other: purpose, place, expected spend

### 4. Pot Creation

Purpose:

- fast creation with minimal friction

Rules:

- common fields first
- category-specific fields only when relevant
- as few steps as possible
- one-screen flow unless complexity forces sectioning

Creation should feel faster than posting in a community board.

### 5. Chat Room

Purpose:

- make coordination and settlement feel like one live room

Required elements:

- room title and participant count
- settlement status badge
- host action row
- host notice card
- participant chat stream
- system messages for join and settlement events
- payment summary card
- message composer

Host actions in demo:

- close recruitment
- request settlement
- manage participants

### 6. Settlement Status

Purpose:

- show payment progress clearly

Required elements:

- total amount input or summary
- per-person amount summary
- participant-by-participant status list
- reminder action for unpaid members
- stage visualization:
  `waiting -> requested -> completed`

Completion should feel visible and satisfying.

### 7. My Payments

Purpose:

- central place for money state, history, and trust reassurance

Required elements:

- point balance hero card
- quick charge buttons: `5,000P`, `10,000P`, `30,000P`, `50,000P`
- in-progress settlement list
- completed payment history
- recent wallet activity
- coupon slot

This screen should borrow visual cues from lightweight finance apps while staying friendly.

## Demo State Model

The demo should continue using a front-end-only state model split into seed data, pure business logic, and rendering.

### User state

- `user`
- `pointBalance`
- `location`
- `campus`
- `ownedCoupons`
- `activeChatId`
- `joinedPotIds`

### UI state

- `route`
- `selectedCategory`
- `selectedPotId`
- `query`
- `radiusFilter`
- `sortMode`
- `settlementTotal`
- `createCategory`

### Pot state

Each pot should support at least:

- `id`
- `category`
- `subCategory`
- `title`
- `description`
- `host`
- `currentMembers`
- `maxMembers`
- `participants`
- `waitingParticipants`
- `perPersonAmount`
- `distanceMeters`
- `joinRadiusMeters`
- `locationSummary`
- `deadlineLabel`
- `recruitStatus`
- `settlementStage`
- `urgencyLabel`
- `trustBadges`
- `detail`
- `timeline`

### Chat state

Each room should support:

- `potId`
- `messages`
- `notice`

Message types:

- participant message
- host message
- mine message
- system message
- settlement request message

### Wallet state

- `payments`
- `settlements`
- `chargeOptions`
- `coupons`

## Behavior Model

The product should feel dynamic through state transitions rather than through external services.

### Discovery behavior

- filter by category
- search by title, location, description, and detail fields
- filter by distance radius
- sort by distance or urgency
- surface recommendation and urgent sections from the same source dataset

### Join behavior

Joining should validate:

- recruitment is still open
- seats remain
- user is inside allowed radius
- user has enough points for the expected amount

Possible outcomes:

- immediate join
- blocked by radius
- blocked by lack of points
- blocked because recruitment is full

### Creation behavior

Creating a pot should:

- normalize common fields
- store category-specific detail fields
- assign trust defaults
- create an initial chat room
- place the new pot at the top of the home feed

### Chat behavior

Chat should support:

- normal message send
- host/system distinction
- join system notices
- settlement request system notices

### Settlement behavior

Settlement should support:

- host requests settlement using total amount
- per-person amount is calculated from active participants
- participant statuses move from waiting to requested to completed
- reminders emit visible system or toast feedback
- when all members are paid, the room and wallet update together

### Wallet behavior

Wallet should support:

- point charging
- current balance update
- pending and completed payment grouping
- recent activity ordering
- coupon surfacing

## Core Implementation Direction

The existing architecture should remain but be expanded.

### `js/potmate-data.js`

Expand the seed to include:

- balanced category data
- richer trust/status fields
- category subtypes
- coupon and wallet metadata
- more realistic chat and settlement examples

### `js/potmate-core.js`

Keep this file as the pure logic layer.

It should own:

- formatters
- search and filter logic
- category-specific card grouping
- join validation
- pot creation normalization
- join / approval transitions
- chat system message creation
- settlement calculations and transitions
- wallet activity shaping

### `js/app.js`

Keep this as the render/controller layer, but refactor enough to make the UI manageable.

Expected responsibilities:

- route transitions
- per-screen render functions
- event delegation
- calling core functions and replacing state
- scroll-safe and app-like updates

If the file becomes too dense, split rendering helpers by screen responsibility while preserving GitHub Pages simplicity.

### `css/style.css`

Extend the current visual system rather than replacing it.

New styling areas likely needed:

- richer home hub sections
- radius/filter controls
- stronger detail trust blocks
- denser but breathable chat layout
- settlement progress UI
- wallet summary and coupon cards
- screen transition polish

## Testing Direction

Because this is still a static demo, testing should focus on deterministic behavior and output hooks.

### Core tests

Add or expand tests for:

- category and distance filtering
- sorting
- join radius enforcement
- point balance enforcement
- category-specific pot creation normalization
- settlement stage transitions
- wallet grouping and ordering

### UI shell tests

Add or expand tests for:

- home hub tokens
- detail trust/status tokens
- chat profile / badge / system message hooks
- settlement progress tokens
- wallet quick charge and coupon tokens

### Bundle smoke tests

Keep the self-contained `potmate_demo.html` build verifiable after the feature expansion.

## Implementation Priority

1. strengthen the home hub and category balance
2. expand pot detail and join logic
3. connect chat and settlement into one believable flow
4. upgrade My Payments and settlement status visibility
5. keep monetization cues present but secondary

## Risks and Mitigations

### Risk: the app becomes a disconnected screen gallery

Mitigation:

- force shared transitions between detail, chat, settlement, and wallet

### Risk: too much scope for a static demo

Mitigation:

- simulate only the core flow deeply
- keep advanced revenue and automation features as supporting UI, not primary flows

### Risk: the single-file render layer becomes hard to maintain

Mitigation:

- keep business logic in pure functions
- split render helpers if needed without introducing framework complexity

## Success Criteria

The demo is successful if:

- a user can understand the service from onboarding and home alone
- each category feels intentionally represented
- joining a pot naturally transitions into communication and payment
- safe settlement feels central, not bolted on
- My Payments feels like a real product surface, not an afterthought
- the app remains easy to run from GitHub Pages using `index.html`
