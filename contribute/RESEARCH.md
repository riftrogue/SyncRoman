# MusicBrainz API Notes for Contribute Flow

This file summarizes practical points for SyncRoman contribute search.

## Base Endpoint

- `https://musicbrainz.org/ws/2/`

## Search Endpoint Needed

- Recording search:
  - `GET /ws/2/recording?query=<lucene_query>&fmt=json&limit=<1..100>&offset=<n>`

## Useful Parameters

- `fmt=json` for browser-friendly parsing.
- `query` supports Lucene syntax.
- `limit` supports 1 to 100 (default 25).
- `offset` supports pagination.
- `dismax=true` can simplify user-entered plain text handling.

## Query Syntax Notes

- Plain query works: `query=masakali ar rahman mohit chauhan`
- Fielded query is possible:
  - `recording:"masakali" AND artist:"mohit chauhan"`
- Advanced operators are supported (`AND`, quoted phrases, etc.).

## Pagination Rules

- Use `limit=5..10` for contribution UX.
- Next page: `offset += limit`.
- Prev page: `offset -= limit` (min 0).

## Rate Limiting Guidance

- MusicBrainz guidance: keep client applications at about 1 request per second.
- Exceeding limits can cause temporary IP blocking.

## Identification Guidance

- MusicBrainz asks for meaningful User-Agent strings.
- In browser-only apps, custom User-Agent cannot be set directly.
- If strict compliance is needed later, use a backend proxy/edge function.

## Response Fields Needed for v1

From `recordings[]`:

- `id` (MBID)
- `title`
- `length` (ms)
- `artist-credit`
- `releases[0].title` (optional album fallback)
- `score` (optional relevance signal)

## Recommended SyncRoman Use

1. Fetch up to 10 results per request.
2. Keep all results, then rank by metadata completeness + token match.
3. Preserve MBID on selected row for immutable song identity.
4. Use selected result to prefill contribute form in next phase.
