# BSE Live Trade Ingestion Dashboard

Pulls a large, slow, chunked "exchange" feed under a hard 30s-per-connection
ceiling, and streams the results onto a live dashboard with **zero client
polling and zero cron** — Supabase Realtime pushes both new trades and pull
status the instant the backend writes them.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind (`/frontend`)
- **Backend:** Express + TypeScript — hosts the Mock BSE API, the chunked
  ingestion worker, and the pull-trigger endpoints, all in one process (`/backend`)
- **Database + Realtime:** Supabase (Postgres + Realtime subscriptions)

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/schema.sql` from this repo. It creates
   the `trades` and `pull_runs` tables, sets read-only RLS policies for the
   anon key, and adds both tables to the `supabase_realtime` publication.
3. Grab two keys from **Project Settings → API**:
   - `service_role` key → goes in `backend/.env` (server-only, never expose it)
   - `anon` key → goes in `frontend/.env.local` (safe for the browser)

## 2. Run the backend

```bash
cd backend
cp .env.example .env   # fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

Starts on `http://localhost:4000`. Sanity-check the mock exchange directly:

```bash
curl "http://localhost:4000/getTrades?offset=0&limit=5"
```

## 3. Run the frontend

```bash
cd frontend
cp .env.example .env.local   # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open `http://localhost:5173`. Click **Start Pull** and watch rows stream in —
open DevTools → Network while it runs; you'll see the backend's own short
calls to `/getTrades`, but nothing polling from the browser itself.

## Demo pacing

Full realism is `TOTAL_TRADES=4800` at `CHUNK_DELAY_MS=1500` with
`CHUNK_LIMIT=100` (~48 chunks × 1.5s ≈ a bit over a minute, tune upward for a
literal 15-minute pull). For a tight 60–90s live demo, the defaults in
`backend/.env.example` are already compressed — turn `CHUNK_DELAY_MS` down
further or `TOTAL_TRADES` down if you need it snappier on stage.

## How the "no 30s connections, no polling" constraint is actually satisfied

- **Ingestion worker → Mock BSE API:** each `/getTrades` call is one chunk
  (`CHUNK_LIMIT` trades) and returns well under 30s. The worker loops many of
  these sequentially — never one held-open request — writing each chunk to
  Supabase as it lands.
- **Frontend → data:** the dashboard loads current state once on mount, then
  subscribes to Postgres `INSERT`/`UPDATE` events via Supabase Realtime. No
  `setInterval`, no refetch loop, anywhere.

## Notes / simplifications made for hackathon speed

- Single concurrent pull run at a time (`POST /api/pull/start` returns `409`
  if one's already running). Multiple/resumable runs are P1 in `PLAN.md`.
- Chunk retry is a simple 2-attempt backoff inside `ingestionWorker.ts`; there's
  no visualized "chunk failed, retrying" UI state yet (P1 stretch — the retry
  *works*, it's just not surfaced in the status bar).
- The mock exchange dataset is deterministically seeded (same data every run)
  so rehearsal and the live demo look identical.
- Analytics panel (trades/min, top symbol) is computed client-side from the
  loaded rows — fine for a few thousand rows, would move server-side for real
  scale.
- No auth — anon key is read-only via RLS, which is enough for a hackathon
  demo. Add real auth before this touches real trade data.
