# Project: Multiplayer Blackjack (no real money)

## Purpose
Portfolio project for job hunt. Goal: demonstrate realtime multiplayer sync, game logic correctness, and full-stack skills beyond CRUD. Author: Sarthak (github.com/5cxr).

## Core concept
Web-based blackjack, virtual currency only. Players join rooms ("tables"), each gets own hand vs one shared dealer, turns proceed in sequence around the table (like a real casino table). Everyone starts with 500 currency.

## Decisions made
- **Room style**: Shared table — multiple players per room, each with own hand, one shared dealer hand, turn-based sequencing. NOT independent solo games grouped by lobby.
- **Auth**: Lightweight — no password. User picks username, gets persistent id via cookie/session. No OAuth/Clerk/Auth0 for v1.
- **Currency**: Virtual only, starts at 500, persists across sessions per user.

## Proposed stack
- Next.js (App Router) + TypeScript
- Realtime: WebSockets via Vercel Functions (Fluid Compute) — no separate WS server needed, works natively on Node runtime now (edge not required for streaming/WS).
- DB: Postgres via Vercel Marketplace (Neon) — tables: users, balances, rooms, hand_history
- Client state: Zustand or similar for table sync
- Deploy target: Vercel

## Core features / build order
1. Username + session (cookie-based persistent id)
2. Room create/join (shareable room code/link)
3. Table state model: seats, current turn, dealer hand, deck/shoe
4. Bet placement per round (deduct from balance, validate against balance)
5. Deal logic: shuffle, deal 2 cards each + dealer (1 up 1 hole)
6. Player actions: hit, stand, double down, split (stretch), (skip insurance for v1 maybe)
7. Dealer logic: standard rules (hit until 17, stand on soft 17 — decide convention)
8. Payout resolution: blackjack 3:2, win 1:1, push, bust — update balances
9. Reconnect handling: player disconnects mid-hand, rejoin without breaking table state
10. Concurrency safety: no double-spend/race on balance updates when multiple actions happen near-simultaneously

## Stretch goals (mentioned as differentiators, not committed)
- Spectator mode
- In-room chat
- Leaderboard (highest balance / biggest win)
- Simple bot filler player when table is short

## Explicitly deferred / out of scope for v1
- Real money / payments
- Player-vs-player betting (this is vs-dealer only, shared table just for social/turn structure)
- Full auth provider (Clerk/Auth0) — revisit only if project needs real accounts later
- Insurance side-bet (maybe stretch)

## Notes on why these choices
- Shared table (vs solo-per-lobby) chosen deliberately for harder realtime sync — bigger portfolio signal than trivial single-player state.
- Lightweight auth chosen to keep scope focused on game/realtime logic, which is the actual differentiator for this project.
