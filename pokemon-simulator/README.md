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
- 1 vs 1 battle simulator: pick fighters from the team or Pokédex, choose their moves and the
  weather, then advance turn by turn or simulate the whole battle. HP bars and the turn log show
  damage, criticals and type effectiveness.
- Matchup analysis with expected damage per move and a batch simulation of 100 battles (win rate
  and average turns) that yields to the browser between batches.
- `OnPush` everywhere, `track` in every `@for` and `@defer` for the team summary, move selector,
  Pokémon stats and battle analysis.

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

## Battle simulator

The battle engine lives in `features/battles/engine` and has no Angular dependencies. It uses a
fixed level of 50 without IVs, EVs or natures:

- HP = `floor(2 × base × level / 100) + level + 10`.
- Other stats = `floor(2 × base × level / 100) + 5`.
- Damage uses the simplified formula with type effectiveness (0, 0.25, 0.5, 1, 2 or 4), STAB
  ×1.5, critical hits ×1.5 (1/24 chance), a random factor of 0.85–1 and the selected weather.
- Weather is data-driven: clear, sun (Fire ×1.5, Water ×0.5) and rain (Water ×1.5, Fire ×0.5).
- Status moves are ignored in this version.

Turns are ordered by speed; ties are resolved by the seeded RNG. The same seed, fighters, moves and
weather always produce the same battle. The UI reads the breakdown from the engine, so criticals,
STAB and effectiveness shown in the log come from the same calculation used for damage.

The efficiency section builds a matchup table using expected damage without randomness and can
simulate 100 battles. Simulations run in batches of 10 with a yield to the browser between batches,
so the interface stays responsive without a separate worker.

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
migrations, the Pokédex store, move loading/validators, the main views and the battle engine
(stats, type effectiveness, weather, criticals, determinism and simulation summaries).
