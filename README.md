# SyncRoman (MVP)

Plain HTML/CSS/JavaScript lyrics preview app backed by Supabase.

## Current MVP Scope

- Search songs from `songs`
- Open lyrics preview modal using `lyrics`
- Copy preview lyrics
- Download lyrics as `.lrc`

## Project Structure

```text
syncroman/
├── index.html
├── submit.html
├── song.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── supabase.js
│   ├── utils.js
│   ├── ui.js
│   ├── songs.js
│   ├── lyrics.js
│   ├── app.js
│   ├── submit.js
│   ├── song-page.js
│   ├── auth.js
│   ├── userbase.js
│   └── admin.js
└── assets/
    └── icons/
```

## File Responsibilities

- `index.html`: Main search and preview page.
- `css/style.css`: Shared styling for main page + modal.
- `js/config.js`: Runtime config values.
- `js/supabase.js`: Supabase client initialization.
- `js/utils.js`: Small helpers (`formatSongLabel`, `sanitizeFilename`, etc.).
- `js/ui.js`: DOM/UI helpers and modal behavior.
- `js/songs.js`: Song search/fetch logic.
- `js/lyrics.js`: Lyrics fetch, preview, copy, download logic.
- `js/app.js`: Entry point that wires modules and event listeners.

Placeholder files (reserved for later):

- `submit.html`, `song.html`
- `js/submit.js`, `js/song-page.js`, `js/auth.js`, `js/userbase.js`, `js/admin.js`

## Run

Open `index.html` in your local server and use song search + preview.
