import { TestBed } from '@angular/core/testing';
import { Observable, throwError } from 'rxjs';
import { NetworkError } from '../../../core/errors/data-error';
import { PokemonIndexEntry, PokemonType } from '../../../core/models';
import { DataResult, POKEDEX_REPOSITORY } from '../data-access/pokedex.repository';
import { FakePokedexRepository } from '../data-access/testing/pokedex-fake.repository';
import { PokedexStore } from './pokedex.store';

class FailingPokedexRepository extends FakePokedexRepository {
  override getPokemonIndex(): Observable<DataResult<readonly PokemonIndexEntry[]>> {
    return throwError(() => new NetworkError('Offline'));
  }
}

function createStore(
  repository: FakePokedexRepository = new FakePokedexRepository(),
): PokedexStore {
  TestBed.configureTestingModule({
    providers: [{ provide: POKEDEX_REPOSITORY, useValue: repository }],
  });

  return TestBed.inject(PokedexStore);
}

describe('PokedexStore', () => {
  it('loads the index and paginates 20 entries per page', () => {
    const store = createStore();

    store.load();

    expect(store.status()).toBe('ready');
    expect(store.totalResults()).toBe(24);
    expect(store.totalPages()).toBe(2);
    expect(store.pageItems()).toHaveLength(20);
    expect(store.dataSource()).toBe('cache');
  });

  it('moves between pages within bounds', () => {
    const store = createStore();
    store.load();

    store.nextPage();
    expect(store.currentPage()).toBe(2);
    expect(store.pageItems()).toHaveLength(4);

    store.nextPage();
    expect(store.currentPage()).toBe(2);

    store.previousPage();
    expect(store.currentPage()).toBe(1);

    store.previousPage();
    expect(store.currentPage()).toBe(1);
  });

  it('filters by name case-insensitively and resets the page', () => {
    const store = createStore();
    store.load();
    store.nextPage();

    store.setQuery('PIKACHU');

    expect(store.totalResults()).toBe(1);
    expect(store.pageItems()[0]?.name).toBe('pikachu');
    expect(store.currentPage()).toBe(1);
  });

  it('filters by type and combines it with the name search', () => {
    const electric: PokemonType = {
      name: 'electric',
      damageRelations: {
        noDamageFrom: [],
        halfDamageFrom: [],
        doubleDamageFrom: [],
        noDamageTo: [],
        halfDamageTo: [],
        doubleDamageTo: [],
      },
      pokemon: ['pikachu'],
    };
    const store = createStore(new FakePokedexRepository(undefined, undefined, [electric]));
    store.load();

    store.setType('electric');

    expect(store.typeStatus()).toBe('ready');
    expect(store.totalResults()).toBe(1);
    expect(store.pageItems()[0]?.name).toBe('pikachu');

    store.setQuery('bulbasaur');
    expect(store.totalResults()).toBe(0);

    store.setType(null);
    expect(store.totalResults()).toBe(1);

    store.clearQuery();
    expect(store.totalResults()).toBe(24);
  });

  it('reports an empty result set', () => {
    const store = createStore();
    store.load();

    store.setQuery('missingno');

    expect(store.totalResults()).toBe(0);
    expect(store.isEmpty()).toBe(true);
    expect(store.hasResults()).toBe(false);
  });

  it('exposes the error and keeps the store in an error state', () => {
    const store = createStore(new FailingPokedexRepository());

    store.load();

    expect(store.status()).toBe('error');
    expect(store.error()).toBe('Offline');
    expect(store.isLoading()).toBe(false);
  });
});
