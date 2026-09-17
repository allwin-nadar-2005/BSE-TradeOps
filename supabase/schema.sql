-- BSE Live Trade Ingestion Dashboard — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push` if you're using the CLI).

create extension if not exists "pgcrypto";

-- One row per ingestion run (a "pull").
create table if not exists public.pull_runs (
  id              uuid primary key default gen_random_uuid(),
  status          text not null default 'idle' check (status in ('idle', 'running', 'completed', 'failed')),
  total_trades    integer,               -- expected total, known once the mock API reports it
  ingested_count  integer not null default 0,
  current_offset  integer not null default 0,
  chunk_size      integer,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  error_message   text
);

-- One row per ingested trade.
create table if not exists public.trades (
  id              uuid primary key default gen_random_uuid(),
  trade_id        text not null unique,
  pull_run_id     uuid references public.pull_runs(id) on delete cascade,
  client          text not null,
  symbol          text not null,
  quantity        numeric not null,
  price           numeric not null,
  trade_timestamp timestamptz not null,
  created_at      timestamptz not null default now()
);

create index if not exists trades_created_at_idx on public.trades (created_at desc);
create index if not exists trades_pull_run_id_idx on public.trades (pull_run_id);
create index if not exists trades_symbol_idx on public.trades (symbol);

-- Row Level Security: allow anonymous read (dashboard is read-only from the browser;
-- all writes happen from the backend using the service_role key, which bypasses RLS).
alter table public.trades enable row level security;
alter table public.pull_runs enable row level security;

drop policy if exists "public read trades" on public.trades;
create policy "public read trades" on public.trades for select using (true);

drop policy if exists "public read pull_runs" on public.pull_runs;
create policy "public read pull_runs" on public.pull_runs for select using (true);

-- Enable Realtime so the frontend gets pushed INSERT/UPDATE events with no polling.
alter publication supabase_realtime add table public.trades;
alter publication supabase_realtime add table public.pull_runs;
