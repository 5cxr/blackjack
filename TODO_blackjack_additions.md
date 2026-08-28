# Blackjack Additions Spec

Status: #1 (bankrupt currency handling) implemented. #2 (table UI/UX) and #3
(cat avatars) still planning-only. Grounded in current code
(`src/lib/rooms.ts`, `src/db/schema.ts`, `src/components/room-view.tsx`).

---

## 1. Bankrupt currency handling — DONE

Implemented: spectator-by-balance (derived, no schema flag) + flat rebuy
(500 chips, 1 hour cooldown) via `claimFreeChips` in `src/lib/rooms.ts` and
`POST /api/rooms/[code]/rebuy`. `users.lastFreeChipsAt` added in migration
`0005_thick_trauma.sql`. New `PlayerHandStatus` value `"spectating"`.
Bankrupt players keep their seat (grayed out, "sitting out") rather than
being freed/kicked, per the earlier open question. Verified end to end
against a live Postgres/Redis (join, drain balance, confirm round deals
without the bankrupt seat blocking, confirm rebuy resets balance and cooldown
rejects a second claim, confirm the seat plays normally again next round).

**Root cause of the original bug:** `placeBet` (rooms.ts:222-223) requires
`allPlayers.every(p => p.bet > 0)` before dealing starts. A seated player at
balance 0 can never place a bet, so `allBet` is never true, and the round
never deals — the whole table is stuck, not just that player.

### Options

- **Spectator status (recommended).** A seated player with `balance === 0`
  becomes a spectator: excluded from the "everyone bet" gate, excluded from
  dealing/turn order, hand stays empty, seat renders grayed out with
  "watching" + a rebuy action. Table keeps playing around them. No schema
  change needed if derived from `users.balance === 0` at bet-check time
  (don't persist a separate spectating flag — it'd need to stay in sync with
  balance and could drift).
- **Rebuy / free chip claim.** Button on a bankrupt seat: resets balance to a
  fixed amount (e.g. 500), gated by a cooldown so it's not infinite money.
  Needs `users.lastFreeChipsAt timestamp`. Cooldown length is a judgment
  call — suggest 15 min for a casual game, longer (24h) if you want scarcity
  to matter.
- **Daily login bonus.** Same mechanism as rebuy, just framed as "claim once
  per day" instead of "claim when broke." Could coexist with rebuy or replace
  it.
- **Auto-kick after grace period.** If a spectator doesn't rebuy within N
  rounds, free their seat for a new joiner. Adds complexity (needs a
  countdown per spectator); skip for v1 unless seats are scarce in practice.

### Recommendation

Spectator-by-balance (derived, no schema flag) + a flat rebuy claim with a
cooldown timestamp on `users`. Simplest change that unblocks the table and
gives a comeback path. Skip auto-kick for now — MAX_SEATS is 6, rooms are
short-lived (30 min idle expiry already exists), not worth the extra state.

Chosen numbers: 500 chip rebuy, 1 hour cooldown.

---

## 2. Table UI/UX

### Layout

- Replace the current 3-column grid (`room-view.tsx:202`) with fixed seat
  positions arranged around an oval table (absolute-positioned divs around a
  felt-green center), dealer hand at the top/center. Seats keep their slot
  regardless of who's sitting there or join order — matches `seat` already
  being a stable index in `roomPlayers`.

### Turn highlight + timer

- Highlight current-turn seat (border glow), already have `currentTurnSeat`
  wired end to end.
- Timer as a depleting green border (conic-gradient or SVG ring) around the
  avatar square. On timeout: auto-stand.

**Flaw to flag:** a client-only timer is not enough. If the client just
doesn't fire the auto-stand call (tab closed, JS paused, or someone patches
the client), the table hangs the same way it does today when a player
disappears mid-turn. Auto-stand needs to be enforced server-side, the same
way idle-room expiry already is (`isExpired`, rooms.ts:27): store
`rooms.turnExpiresAt`, and when any request touches the room (a poll, another
player's action) check whether the current turn has expired and auto-stand
it before proceeding. Client renders the countdown from `turnExpiresAt` for
visuals; server is the actual source of truth. This reuses the lazy-check
pattern already in the codebase instead of needing a new cron job.

Needs: `rooms.turnExpiresAt timestamp`, set whenever `currentTurnSeat`
changes (start of turn) in `advanceTurn` and the initial deal.

### Open question for you

Turn duration — pick a number (15s? 20s?). Also: should the timer bar be
purely decorative sugar on top of a generous server-side cutoff, or should
server and client use the *same* duration exactly? (Recommend: same duration,
otherwise a player who acts right as their visual timer hits zero gets
rejected by the server, which feels broken.)

---

## 3. Cat avatars

Three independent, cycling parameters — color, eyes, face — combined
skribbl.io-style: big preview in the middle, left/right arrow pair next to
each of the three rows to step through that parameter's options
independently.

- Store as three small integers on `users` (e.g. `avatarColor`,
  `avatarEyes`, `avatarFace`, each `default(0)`), not on `roomPlayers` —
  avatar is a player identity thing, should persist across rooms, not be
  re-picked every game.
- Rendering: no image assets in the repo currently, so recommend
  **SVG built from CSS/inline shapes**, not sprite images — each parameter
  picks a swappable piece (fill color, eye shape, face/mouth shape) layered
  in one SVG. Avoids needing an asset pipeline or uploads, keeps it all in
  code, and is trivial to add more options to later (grow the enum, no new
  assets to source).
- Edit restricted to pre-game: only rendered/enabled while
  `room.status === "waiting"` (matches existing status enum, no new state
  needed).

### Open question for you

How many options per parameter? Even something small like 6 colors × 5 eyes
× 5 faces = 150 combinations is plenty for a casual game and keeps the SVG
set hand-drawable in one sitting. Confirm count before I start building
variants, since that's the thing that determines how much SVG work this is.

---

## Schema deltas across #2 and #3 (remaining)

```
users:
  + avatarColor    integer not null default 0
  + avatarEyes     integer not null default 0
  + avatarFace     integer not null default 0

rooms:
  + turnExpiresAt  timestamp with time zone (nullable)
```

(`users.lastFreeChipsAt` from #1 already landed in migration
`0005_thick_trauma.sql`.) No changes needed to `roomPlayers` — avatar lives
on `users`, turn timer lives on `rooms`.

## Sequencing suggestion

#1 (currency) is done. #2 and #3 are additive UI and don't depend on each
other; either order works next.
