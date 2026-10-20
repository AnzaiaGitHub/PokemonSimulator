import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { Connectivity } from '../../../core/connectivity/connectivity';
import { LOCAL_DB_NAME } from '../../../core/database/local-db.provider';
import { NotFoundError } from '../../../core/errors/data-error';
import { Move, Pokemon, TeamSlot } from '../../../core/models';
import { DataResult, POKEDEX_REPOSITORY } from '../../pokedex/data-access/pokedex.repository';
import { SpriteService } from '../../pokedex/data-access/sprite';
import { FakePokedexRepository } from '../../pokedex/data-access/testing/pokedex-fake.repository';
import { TeamOfflineDownload } from './offline-download';

function createMove(name: string): Move {
  return {
    id: 1,
    name,
    type: 'normal',
    damageClass: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    priority: 0,
    fetchedAt: 0,
  };
}

function createPokemon(id: number, name: string, learnset: readonly string[]): Pokemon {
  return {
    id,
    name,
    heightInMeters: 1,
    weightInKilograms: 10,
    types: ['normal'],
    stats: {
      hp: 50,
      attack: 50,
      defense: 50,
      specialAttack: 50,
      specialDefense: 50,
      speed: 50,
    },
    learnset,
    spriteUrl: null,
    fetchedAt: 0,
  };
}

function createSlot(pokemon: Pokemon): TeamSlot {
  return { pokemon, moves: [] };
}

class FakeOfflineRepository extends FakePokedexRepository {
  readonly pokemonCalls: string[] = [];

  constructor(
    private readonly moves: readonly Move[],
    details: readonly Pokemon[],
  ) {
    super([], details);
  }

  override getPokemon(nameOrId: string | number): Observable<DataResult<Pokemon>> {
    this.pokemonCalls.push(String(nameOrId));
    return super.getPokemon(nameOrId);
  }

  override getMove(name: string): Observable<DataResult<Move>> {
    const move = this.moves.find((entry) => entry.name === name);

    return move
      ? of({ data: move, source: 'network' })
      : throwError(() => new NotFoundError(`Move not found: ${name}`));
  }
}

let databaseCounter = 0;

function setup(
  repository: FakeOfflineRepository,
  online = true,
): { service: TeamOfflineDownload; prefetch: ReturnType<typeof vi.fn> } {
  const prefetch = vi.fn(() => Promise.resolve());

  TestBed.configureTestingModule({
    providers: [
      { provide: LOCAL_DB_NAME, useValue: `offline-download-test-${++databaseCounter}` },
      { provide: POKEDEX_REPOSITORY, useValue: repository },
      { provide: SpriteService, useValue: { prefetch } },
      { provide: Connectivity, useValue: { isOnline: signal(online) } },
    ],
  });

  return { service: TestBed.inject(TeamOfflineDownload), prefetch };
}

describe('TeamOfflineDownload', () => {
  it('downloads details, sprites and learnable moves and reports progress', async () => {
    const pokemon = [
      createPokemon(1, 'bulbasaur', ['tackle', 'growl']),
      createPokemon(25, 'pikachu', ['tackle', 'thunder-shock']),
    ];
    const repository = new FakeOfflineRepository(
      [createMove('tackle'), createMove('growl'), createMove('thunder-shock')],
      pokemon,
    );
    const { service, prefetch } = setup(repository);

    await service.start(pokemon.map(createSlot));

    expect(repository.pokemonCalls).toEqual(['bulbasaur', 'pikachu']);
    expect(prefetch).toHaveBeenCalledTimes(2);
    expect(service.status()).toBe('success');
    expect(service.total()).toBe(7);
    expect(service.completed()).toBe(7);
    expect(service.failed()).toBe(0);
    expect(service.percent()).toBe(100);
  });

  it('keeps partial progress when a sprite fails', async () => {
    const pokemon = [createPokemon(1, 'bulbasaur', ['tackle'])];
    const repository = new FakeOfflineRepository([createMove('tackle')], pokemon);
    const { service, prefetch } = setup(repository);
    prefetch.mockRejectedValueOnce(new Error('network down'));

    await service.start(pokemon.map(createSlot));

    expect(service.status()).toBe('success');
    expect(service.failed()).toBe(1);
    expect(service.completed()).toBe(3);
    expect(service.message()).toContain('1 item');
  });

  it('rejects an empty team', async () => {
    const { service } = setup(new FakeOfflineRepository([], []));

    await service.start([null, null]);

    expect(service.status()).toBe('error');
    expect(service.message()).toContain('Add at least one Pokémon');
  });

  it('rejects the download while offline', async () => {
    const pokemon = [createPokemon(1, 'bulbasaur', ['tackle'])];
    const { service } = setup(new FakeOfflineRepository([], pokemon), false);

    await service.start(pokemon.map(createSlot));

    expect(service.status()).toBe('error');
    expect(service.message()).toContain('offline');
  });

  it('cancels a running download and keeps saved data', async () => {
    const pokemon = [createPokemon(1, 'bulbasaur', ['tackle'])];
    const repository = new FakeOfflineRepository([createMove('tackle')], pokemon);
    const { service } = setup(repository);

    const startPromise = service.start(pokemon.map(createSlot));
    service.cancel();
    await startPromise;

    expect(service.status()).toBe('cancelled');
    expect(service.message()).toContain('cancelled');
  });
});
