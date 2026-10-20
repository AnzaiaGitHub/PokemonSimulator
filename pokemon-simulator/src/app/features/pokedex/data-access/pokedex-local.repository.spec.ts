import { TestBed } from '@angular/core/testing';
import { firstValueFrom, throwError } from 'rxjs';
import { Connectivity } from '../../../core/connectivity/connectivity';
import { LocalDb } from '../../../core/database';
import { APP_DATABASE, LOCAL_DB_NAME } from '../../../core/database/local-db.provider';
import { AppDatabase } from '../../../core/database/local-db.schema';
import { NotFoundError, NetworkError } from '../../../core/errors/data-error';
import { PokemonIndexEntry } from '../../../core/models';
import { POKEDEX_FIXTURES } from './mock/pokedex-fixtures';
import { LocalPokedexRepository, POKEDEX_SOURCE } from './pokedex-local.repository';
import {
  DEFAULT_CACHE_TTL_MS,
  POKEDEX_CACHE_CONFIG,
  POKEDEX_REPOSITORY,
  PokedexRepository,
} from './pokedex.repository';
import { FakePokedexRepository } from './testing/pokedex-fake.repository';

let database: AppDatabase | null = null;
let dbCounter = 0;

interface SetupOptions {
  readonly ttlMs?: number;
  readonly online?: boolean;
  readonly source?: PokedexRepository;
}

function setup(options: SetupOptions = {}): {
  repository: PokedexRepository;
  localDb: LocalDb;
  database: AppDatabase;
} {
  const name = `pokemon-simulator-repository-test-${++dbCounter}`;

  TestBed.configureTestingModule({
    providers: [
      { provide: LOCAL_DB_NAME, useValue: name },
      {
        provide: POKEDEX_CACHE_CONFIG,
        useValue: { ttlMs: options.ttlMs ?? DEFAULT_CACHE_TTL_MS },
      },
      {
        provide: Connectivity,
        useValue: { isOnline: () => options.online ?? true },
      },
      options.source
        ? { provide: POKEDEX_SOURCE, useValue: options.source }
        : { provide: POKEDEX_SOURCE, useClass: FakePokedexRepository },
      { provide: POKEDEX_REPOSITORY, useClass: LocalPokedexRepository },
    ],
  });

  const repository = TestBed.inject(POKEDEX_REPOSITORY);
  const localDb = TestBed.inject(LocalDb);
  const db = TestBed.inject(APP_DATABASE);
  database = db;

  return { repository, localDb, database: db };
}

class CountingPokedexRepository extends FakePokedexRepository {
  pokemonCalls = 0;

  override getPokemon(nameOrId: string | number) {
    this.pokemonCalls += 1;

    return super.getPokemon(nameOrId);
  }
}

class OfflinePokedexRepository extends FakePokedexRepository {
  override getPokemon(): ReturnType<FakePokedexRepository['getPokemon']> {
    return throwError(() => new NetworkError('No connection'));
  }
}

describe('LocalPokedexRepository', () => {
  afterEach(async () => {
    if (database) {
      database.close();
      await database.delete().catch(() => undefined);
      database = null;
    }
  });

  it('seeds IndexedDB on first load and reads from cache afterwards', async () => {
    const { repository, localDb } = setup();

    const first = await firstValueFrom(repository.getPokemonIndex());
    const second = await firstValueFrom(repository.getPokemonIndex());

    expect(first.source).toBe('network');
    expect(first.data).toHaveLength(POKEDEX_FIXTURES.length);
    expect(second.source).toBe('cache');
    expect(second.data).toHaveLength(POKEDEX_FIXTURES.length);
    expect(localDb.status()).toBe('indexeddb');
  });

  it('clears cached data created by an older data source', async () => {
    const { repository, localDb } = setup();

    await localDb.putPokemonIndex({ id: 999, name: 'old-cache-entry' });
    await localDb.setMeta('cacheVersion', 0);

    const result = await firstValueFrom(repository.getPokemonIndex());

    expect(result.source).toBe('network');
    expect(result.data).toHaveLength(POKEDEX_FIXTURES.length);
    expect(await localDb.getMeta('cacheVersion')).toBe(2);
    expect(await localDb.getPokemonIndex()).not.toContainEqual({
      id: 999,
      name: 'old-cache-entry',
    });
  });

  it('caches Pokémon details by name and reads them by id', async () => {
    const { repository } = setup();

    const stored = await firstValueFrom(repository.getPokemon('pikachu'));
    const cachedById = await firstValueFrom(repository.getPokemon(stored.data.id));

    expect(stored.source).toBe('network');
    expect(stored.data.name).toBe('pikachu');
    expect(cachedById.source).toBe('cache');
    expect(cachedById.data.name).toBe('pikachu');
  });

  it('does not cache unknown resources and propagates the error', async () => {
    const { repository, localDb } = setup();

    await expect(firstValueFrom(repository.getPokemon('missingno'))).rejects.toBeInstanceOf(
      NotFoundError,
    );

    expect(await localDb.getPokemonByName('missingno')).toBeUndefined();
  });

  it('reports move and type lookups as unsupported by the current source', async () => {
    const { repository } = setup();

    await expect(firstValueFrom(repository.getMove('thunderbolt'))).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(firstValueFrom(repository.getType('electric'))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('serves fresh cached data without calling the network', async () => {
    const source = new CountingPokedexRepository();
    const { repository, localDb } = setup({ source, ttlMs: 60_000 });
    const pikachu = POKEDEX_FIXTURES.find((pokemon) => pokemon.name === 'pikachu');

    await localDb.setMeta('cacheVersion', 2);
    await localDb.putPokemon({ ...pikachu!, fetchedAt: Date.now() });

    const result = await firstValueFrom(repository.getPokemon('pikachu'));

    expect(result.source).toBe('cache');
    expect(source.pokemonCalls).toBe(0);
  });

  it('returns stale cached data and revalidates in the background', async () => {
    const source = new CountingPokedexRepository();
    const { repository, localDb } = setup({ source, ttlMs: 0 });
    const pikachu = POKEDEX_FIXTURES.find((pokemon) => pokemon.name === 'pikachu');

    await localDb.setMeta('cacheVersion', 2);
    await localDb.putPokemon({ ...pikachu!, fetchedAt: 1 });

    const result = await firstValueFrom(repository.getPokemon('pikachu'));

    expect(result.source).toBe('cache');

    await waitForBackgroundWork();

    expect(source.pokemonCalls).toBe(1);
    expect((await localDb.getPokemonByName('pikachu'))?.fetchedAt).toBeGreaterThan(1);
  });

  it('does not revalidate stale data while offline', async () => {
    const source = new CountingPokedexRepository();
    const { repository, localDb } = setup({ source, ttlMs: 0, online: false });
    const pikachu = POKEDEX_FIXTURES.find((pokemon) => pokemon.name === 'pikachu');

    await localDb.setMeta('cacheVersion', 2);
    await localDb.putPokemon({ ...pikachu!, fetchedAt: 1 });

    const result = await firstValueFrom(repository.getPokemon('pikachu'));

    await waitForBackgroundWork();

    expect(result.source).toBe('cache');
    expect(source.pokemonCalls).toBe(0);
  });

  it('returns a clear error when there is no network and no cached copy', async () => {
    const { repository } = setup({ source: new OfflinePokedexRepository(), online: false });

    await expect(firstValueFrom(repository.getPokemon('pikachu'))).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  it('revalidates the local index after its TTL expires', async () => {
    const source = new CountingPokedexRepository();
    const { repository, localDb } = setup({ source, ttlMs: 0 });
    const index: readonly PokemonIndexEntry[] = [{ id: 25, name: 'pikachu' }];

    await localDb.setMeta('cacheVersion', 2);
    await localDb.bulkPutPokemonIndex(index);
    await localDb.setMeta('pokemonIndexFetchedAt', 1);

    const result = await firstValueFrom(repository.getPokemonIndex());

    expect(result.source).toBe('cache');

    await waitForBackgroundWork();

    expect(await localDb.getPokemonIndex()).toHaveLength(POKEDEX_FIXTURES.length);
    expect(await localDb.getMeta<number>('pokemonIndexFetchedAt')).toBeGreaterThan(1);
  });
});

async function waitForBackgroundWork(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
