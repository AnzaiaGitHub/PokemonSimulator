import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { NotFoundError } from '../../../core/errors/data-error';
import { LocalDb } from '../../../core/database';
import { APP_DATABASE, LOCAL_DB_NAME } from '../../../core/database/local-db.provider';
import { AppDatabase } from '../../../core/database/local-db.schema';
import { POKEDEX_FIXTURES } from './mock/pokedex-fixtures';
import { LocalPokedexRepository, POKEDEX_SOURCE } from './pokedex-local.repository';
import { POKEDEX_REPOSITORY, PokedexRepository } from './pokedex.repository';
import { FakePokedexRepository } from './testing/pokedex-fake.repository';

let database: AppDatabase | null = null;
let dbCounter = 0;

function setup(): { repository: PokedexRepository; localDb: LocalDb; database: AppDatabase } {
  const name = `pokemon-simulator-repository-test-${++dbCounter}`;

  TestBed.configureTestingModule({
    providers: [
      { provide: LOCAL_DB_NAME, useValue: name },
      { provide: POKEDEX_SOURCE, useClass: FakePokedexRepository },
      { provide: POKEDEX_REPOSITORY, useClass: LocalPokedexRepository },
    ],
  });

  const repository = TestBed.inject(POKEDEX_REPOSITORY);
  const localDb = TestBed.inject(LocalDb);
  const db = TestBed.inject(APP_DATABASE);
  database = db;

  return { repository, localDb, database: db };
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
    expect(await localDb.getMeta('cacheVersion')).toBe(1);
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
});
