# SyncRoman

SyncRoman is a lightweight web app for browsing songs and previewing synced lyrics (LRC) from a Supabase backend.

## Status

MVP in active development.

## Current Scope

- Song search and listing
- Lyrics preview in modal
- Copy lyrics to clipboard
- Download lyrics as `.lrc`

## Tech Stack

- HTML, CSS, vanilla JavaScript
- Supabase (data and API)

## Project Layout

```text
.
├── index.html
├── song.html
├── submit.html
├── css/
├── js/
└── assets/
```

## Local Run

Open `index.html` in a browser, or serve the project with a simple static server.

## Roadmap

- Add dedicated song detail flow (`song.html` + `js/song-page.js`)
- Implement lyric submission flow (`submit.html` + `js/submit.js`)
- Add authentication and user roles (`js/auth.js`, `js/userbase.js`, `js/admin.js`)
- Improve validation, error handling, and UI polish

## License

No license specified yet.


