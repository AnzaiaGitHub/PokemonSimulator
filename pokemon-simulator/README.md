# PokemonSimulator

Angular application to browse Pokémon from PokéAPI, build a team and simulate battles. Downloaded
data is cached in IndexedDB so the Pokédex keeps working without a connection.

## Features

- Pokédex with local search, type filter, pagination and Pokémon detail pages.
- IndexedDB cache for Pokémon, moves, types, sprites, teams and trainers.
- Cache-first repository with TTL and stale-while-revalidate.
- HTTP queue with configurable concurrency, deduplication and exponential backoff for `429`/`5xx`.
- Offline indicator and local sprite blobs.
- Settings page to inspect storage usage, request persistent storage and clear cached data while
  keeping teams and trainers.

## Development server

Run:

```bash
npm start
```

Open `http://localhost:4200/`. The application reloads automatically when source files change.

## API configuration

The PokéAPI base URL is read from `.env` in the project root:

```bash
POKEAPI_URL=https://pokeapi.co/api/v2
```

`npm start`, `npm run build` and `npm test` run `scripts/generate-env.mjs`, which generates the
git-ignored `src/environments/environment.local.ts`. If the variable is missing,
`https://pokeapi.co/api/v2` is used.

## Data and caching

All screens read through `PokedexRepository`, never directly from the API. `LocalPokedexRepository`
follows this policy:

1. Return the copy stored in IndexedDB when it exists.
2. If the copy is older than the TTL (24 hours by default), return it immediately and refresh it in
   the background when the browser is online.
3. If there is no local copy, call PokéAPI through the request queue.
4. If there is no local copy and no connection, return a clear `NetworkError`.

The 18 types, sprites and the Pokémon index are also stored locally. The schema is versioned, and
upgrades preserve teams and trainers.

## Code quality

```bash
npm run lint
npm run format:check
```

## Tests

Unit tests use Vitest and `fake-indexeddb`:

```bash
npm test
```

They cover mappers, the HTTP queue, cache hit/miss, TTL/revalidation, offline errors, schema
migrations, the Pokédex store and the main views.
