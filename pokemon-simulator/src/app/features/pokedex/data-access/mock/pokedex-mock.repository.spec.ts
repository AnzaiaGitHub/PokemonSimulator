import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { NetworkError, NotFoundError } from '../../../../core/errors/data-error';
import { POKEDEX_REPOSITORY, PokedexRepository } from '../pokedex.repository';
import { providePokedexMock } from './pokedex-mock.config';
import { POKEDEX_FIXTURES } from './pokedex-fixtures';

function createRepository(fail = false): PokedexRepository {
  TestBed.configureTestingModule({
    providers: [providePokedexMock({ delayMs: 0, fail })],
  });

  return TestBed.inject(POKEDEX_REPOSITORY);
}

describe('InMemoryPokedexRepository', () => {
  it('returns the full index from the fixtures', async () => {
    const repository = createRepository();

    const result = await firstValueFrom(repository.getPokemonIndex());

    expect(result.data).toHaveLength(POKEDEX_FIXTURES.length);
    expect(result.data[0]).toEqual({ id: 1, name: 'bulbasaur' });
    expect(result.source).toBe('cache');
  });

  it('returns a Pokémon by name and by id', async () => {
    const repository = createRepository();

    const byName = await firstValueFrom(repository.getPokemon('pikachu'));
    const byId = await firstValueFrom(repository.getPokemon(13));

    expect(byName.data.name).toBe('pikachu');
    expect(byId.data.name).toBe('pikachu');
  });

  it('fails with NotFoundError for an unknown Pokémon', async () => {
    const repository = createRepository();

    await expect(firstValueFrom(repository.getPokemon('missingno'))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('can simulate a network failure', async () => {
    const repository = createRepository(true);

    await expect(firstValueFrom(repository.getPokemonIndex())).rejects.toBeInstanceOf(NetworkError);
  });
});
