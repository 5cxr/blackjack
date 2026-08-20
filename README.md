# Blackjack

Multiplayer blackjack, virtual currency only. See `CONTEXT.md` for the full design and build-order writeup.

Live: https://blackjack-nine-gamma.vercel.app

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

Provisioned via Vercel Marketplace: `vercel integration add neon` and
`vercel integration add upstash/upstash-kv`, both connected to Production/Preview/Development
and injecting `DATABASE_URL` / `REDIS_URL` directly — no code changes needed, both are
standard wire-protocol connection strings the existing `pg`/`ioredis` clients already speak.

`SESSION_SECRET` is set separately per environment (`vercel env add SESSION_SECRET production`) —
it isn't provisioned by an integration.

```bash
vercel deploy --prod
```

GitHub push-to-deploy isn't wired up (the CLI's auto-connect failed against this repo);
deploys are manual via the command above until that's fixed in the dashboard's Git settings.
