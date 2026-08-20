# Blackjack

Multiplayer blackjack, virtual currency only. Players join a shared table by
room code, each gets their own hand against one dealer, turns go in sequence
around the table — like a real casino table, not a pile of solo games.

**Live: https://blackjack-nine-gamma.vercel.app**

Everyone starts with 500 chips. No real money, no accounts beyond picking a
username. Standard rules: blackjack pays 3:2, dealer stands on soft 17, hit /
stand / double down supported.

Built with Next.js, Postgres (Drizzle ORM), and Redis-backed WebSockets for
real-time table sync. Full design notes and build log in `CONTEXT.md`.

## Local setup

```bash
npm install
docker compose up -d              # local Postgres + Redis
cp .env.local.example .env.local  # fill in SESSION_SECRET
npm run db:migrate
npx vercel dev                    # not `npm run dev` — see CONTEXT.md
```
