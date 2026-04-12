create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source text not null default 'web',
  mbid text not null,
  title text not null,
  artist text not null,
  album text,
  duration_seconds integer not null check (duration_seconds >= 0),
  normalized_title text not null,
  normalized_artist text not null,
  normalized_combined text not null,
  lrc_text text not null,
  normalized_lrc_hash text not null,
  idempotency_key text not null unique,
  submitter_fingerprint text not null,
  validation_warnings jsonb not null default '[]'::jsonb,
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists idx_submissions_status_created_at
  on public.submissions (status, created_at desc);

create index if not exists idx_submissions_mbid
  on public.submissions (mbid);

create index if not exists idx_submissions_fingerprint_created_at
  on public.submissions (submitter_fingerprint, created_at desc);

alter table public.submissions enable row level security;
