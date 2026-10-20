import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { NotFoundError } from '../../../core/errors/data-error';
import { LocalDb } from '../../../core/database';
import { APP_DATABASE, LOCAL_DB_NAME } from '../../../core/database/local-db.provider';
import { AppDatabase } from '../../../core/database/local-db.schema';
import { providePokedexLocal } from './pokedex-local.config';
import { POKEDEX_FIXTURES } from './mock/pokedex-fixtures';
import { POKEDEX_REPOSITORY, PokedexRepository } from './pokedex.repository';

let database: AppDatabase | null = null;
let dbCounter = 0;

function setup(): { repository: PokedexRepository; localDb: LocalDb; database: AppDatabase } {
  const name = `pokemon-simulator-repository-test-${++dbCounter}`;

  TestBed.configureTestingModule({
    providers: [{ provide: LOCAL_DB_NAME, useValue: name }, providePokedexLocal({ delayMs: 0 })],
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
