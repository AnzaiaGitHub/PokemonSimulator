import { mapPokemonIndexResponse } from './pokemon-index.mapper';

describe('mapPokemonIndexResponse', () => {
  it('maps names and extracts ids from resource urls', () => {
    const index = mapPokemonIndexResponse({
      count: 2,
      next: null,
      previous: null,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2' },
      ],
    });

    expect(index).toEqual([
      { id: 1, name: 'bulbasaur' },
      { id: 2, name: 'ivysaur' },
    ]);
  });

  it('skips resources without a numeric id', () => {
    const index = mapPokemonIndexResponse({
      count: 2,
      next: null,
      previous: null,
      results: [
        { name: 'missingno', url: 'https://pokeapi.co/api/v2/pokemon/missingno/' },
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      ],
    });

    expect(index).toEqual([{ id: 1, name: 'bulbasaur' }]);
  });
});
