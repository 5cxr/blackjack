# Blackjack

Multiplayer blackjack, virtual currency only. See `CONTEXT.md` for the full design and build-order writeup.

## Local setup

```bash
npm install
docker compose up -d       # local Postgres + Redis
cp .env.local.example .env.local
# fill in SESSION_SECRET (any random string) — DATABASE_URL/REDIS_URL
# already match the docker-compose defaults
npm run db:migrate
```

Realtime updates run over WebSockets on a Vercel Function (`experimental_upgradeWebSocket`),
which **`next dev` does not emulate** — the upgrade request never reaches the route handler.
Use the Vercel CLI instead:

```bash
npx vercel dev
```

`next dev` still works for everything else (plain pages/API routes); it just won't push
live table updates — the client falls back to a 15s poll in that case.

## Database

Drizzle ORM. After changing `src/db/schema.ts`:

```bash
npm run db:generate   # writes a migration file
npm run db:migrate    # applies it
```

`npm run db:studio` opens Drizzle Studio against the local DB.

## Deploying

Swap `DATABASE_URL` for a Neon connection string and `REDIS_URL` for a managed Redis
(both available via the Vercel Marketplace) — no code changes needed, both are standard
wire-protocol clients.
