# Project: Multiplayer Blackjack (no real money)

## Purpose
Portfolio project for job hunt. Goal: demonstrate realtime multiplayer sync, game logic correctness, and full-stack skills beyond CRUD. Author: Sarthak (github.com/5cxr).

## Core concept
Web-based blackjack, virtual currency only. Players join rooms ("tables"), each gets own hand vs one shared dealer, turns proceed in sequence around the table (like a real casino table). Everyone starts with 500 currency.

## Decisions made
- **Room style**: Shared table — multiple players per room, each with own hand, one shared dealer hand, turn-based sequencing. NOT independent solo games grouped by lobby.
- **Auth**: Lightweight — no password. User picks username, gets persistent id via cookie/session. No OAuth/Clerk/Auth0 for v1.
- **Currency**: Virtual only, starts at 500, persists across sessions per user.

## Stack (as built)
- Next.js 16 (App Router) + TypeScript, Tailwind
- DB: Postgres via Drizzle ORM — local via docker-compose for dev, swap `DATABASE_URL` to Neon (Vercel Marketplace) at deploy time. Tables: users, rooms, room_players.
- Realtime: WebSockets via Vercel Functions (Fluid Compute), using `@vercel/functions`'s `experimental_upgradeWebSocket`. Requires `vercel dev` for local testing — plain `next dev` does not emulate the WS upgrade at all (confirmed empirically: the upgrade request never reaches the route handler under `next dev`).
- Cross-instance fanout: Redis pub/sub (`ioredis`) — local via docker-compose, swap for a managed Redis (Marketplace) at deploy time. Required because a Vercel Function gives no instance affinity: two players in the same room can have their WS connections pinned to different instances, so an in-memory broadcast map alone can't reach both. Each instance keeps a local `Map<roomCode, Set<WebSocket>>` for dispatch to its own sockets; a mutation publishes a lightweight "update" signal to `room:{code}`, and every instance subscribed to that channel forwards it to its local sockets, which then refetch full state over the existing masked REST endpoint. A 15s poll runs alongside the socket as a safety net (WS down / silently dropped without a close event).
- Deploy target: Vercel — live at https://blackjack-nine-gamma.vercel.app (manual `vercel deploy --prod`; GitHub push-to-deploy not wired up, see README)

## Core features / build order (all done)
1. Username + session (cookie-based persistent id) — HMAC-signed httpOnly cookie, no DB dependency for the cookie itself
2. Room create/join (shareable 5-char room code)
3. Table state model: seats, current turn, dealer hand, deck/shoe
4. Bet placement per round (deduct from balance, validate against balance) — row-locked tx, no double-spend
5. Deal logic: shuffle, deal 2 cards each + dealer (1 up 1 hole) — hole card and shoe order never sent to clients until the dealer's turn resolves
6. Player actions: hit, stand, double down — auto-stand at 21, fixed turn order skips natural blackjacks. Split is stretch-scoped, not built.
7. Dealer logic: hit until 17, stand on soft 17 (S17 — the more player-favorable convention, chosen explicitly)
8. Payout resolution: blackjack 3:2, win 1:1, push, bust — settlement is a pure, unit-tested function (`computePayout`); balance credit is an atomic SQL increment, not read-then-write
9. Reconnect handling: no in-memory connection state to lose — all table state lives in Postgres, WS reconnects with exponential backoff and refetches on reconnect
10. Concurrency safety: `SELECT ... FOR UPDATE` on the room row serializes every mutating action against that room; atomic SQL increments for balance changes

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
- Visual design pass — UI is currently plain Tailwind, functional only. Game logic and realtime sync were the priority for v1; styling is a deliberate follow-up, not an oversight.

## Notes on why these choices
- Shared table (vs solo-per-lobby) chosen deliberately for harder realtime sync — bigger portfolio signal than trivial single-player state.
- Lightweight auth chosen to keep scope focused on game/realtime logic, which is the actual differentiator for this project.
