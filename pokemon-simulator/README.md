# PokemonSimulator

Angular application to browse Pokémon from PokéAPI, build a team and simulate battles. Downloaded
data is cached in IndexedDB so the Pokédex keeps working without a connection.

## Features

- Pokédex with local search, type filter, pagination and Pokémon detail pages.
- IndexedDB cache for Pokémon, moves, types, sprites, teams and trainers.
- Cache-first repository with TTL and stale-while-revalidate.
- HTTP queue with configurable concurrency, deduplication and exponential backoff for `429`/`5xx`.
- Offline indicator and local sprite blobs.
- Move editor for every team slot: learnset loaded on demand, search and filters by type and class,
  max 4 moves with duplicate validation, attack-move warnings and default attack moves.
- "Download for offline" on the team page: saves details, sprites and learnable moves for the
  current team with progress, failure reporting and cancellation.
- Settings page to inspect storage usage, request persistent storage and clear cached data while
  keeping teams and trainers.
- `OnPush` everywhere, `track` in every `@for` and `@defer` for the team summary, move selector and
  Pokémon stats.

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

Move details are downloaded only when the move selector opens for a team slot. They are stored in
the `moves` store, reused offline and requested through the same concurrency-limited HTTP queue. A
Pokémon's learnset comes from its cached detail, so the selector never needs the API to know which
moves are available. Selected moves are saved with the team slot and restored on reload.

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
migrations, the Pokédex store, move loading/validators and the main views.
