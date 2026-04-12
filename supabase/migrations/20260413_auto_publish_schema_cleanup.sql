-- Phase: Auto-publish model
-- Keep submissions as lightweight anti-spam / dedupe log table.

-- Songs: add fields needed for canonical metadata + search normalization.
alter table public.songs
  add column if not exists mbid text,
  add column if not exists album text,
  add column if not exists normalized_title text,
  add column if not exists normalized_artist text,
  add column if not exists normalized_combined text,
  add column if not exists created_at timestamptz default now();

-- Enforce MBID uniqueness for rows that have MBID.
create unique index if not exists idx_songs_mbid_unique
  on public.songs (mbid)
  where mbid is not null;

create index if not exists idx_songs_normalized_combined
  on public.songs (normalized_combined);

-- Lyrics: keep one row per song and track update metadata.
alter table public.lyrics
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by text,
  add column if not exists votes int4 default 0;

create unique index if not exists idx_lyrics_song_id_unique
  on public.lyrics (song_id);

-- Submissions: remove moderation workflow columns.
alter table public.submissions
  drop column if exists status,
  drop column if exists reviewed_at,
  drop column if exists reviewed_by,
  drop column if exists rejection_reason;

-- Submissions: ensure anti-spam indexes remain.
create index if not exists idx_submissions_mbid
  on public.submissions (mbid);

create index if not exists idx_submissions_fingerprint_time
  on public.submissions (submitter_fingerprint, created_at);
