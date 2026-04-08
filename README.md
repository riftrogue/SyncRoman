# SyncRoman

SyncRoman is a lightweight web app for browsing songs and previewing synced lyrics (LRC) from a Supabase backend.

## Status

MVP in active development.

## Current Scope

- Song search and listing (Supabase)
- Lyrics preview in modal
- Copy lyrics to clipboard
- Download lyrics as `.lrc`
- About page

## Tech Stack

- HTML, CSS, vanilla JavaScript
- Supabase (data and API)

## Project Layout

```text
.
├── index.html
├── homepage/
├── contribute/
├── about/
├── utils/
└── assets/
```

## Code Flow

- `index.html` is the home entry page.
- `utils/config.js` provides runtime config.
- `utils/supabase.js` initializes `window.SyncRomanClient`.
- `utils/utils.js` contains shared helper functions.
- `homepage/songs.js` fetches song search results.
- `homepage/lyrics.js` fetches lyrics and handles preview copy/download.
- `homepage/ui.js` handles DOM rendering and modal interactions.
- `homepage/app.js` wires the modules together as the home controller.
- `about/about.html` + `about/about.css` power the About page.


## Roadmap

- Build contribution flow under `contribute/`
- Add authentication and contributor roles
- Improve validation, error handling, and UI polish
- Add dedicated song detail page

## License

No license specified yet.


