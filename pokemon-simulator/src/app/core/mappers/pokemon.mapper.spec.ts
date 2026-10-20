import { mapPokemonResponse } from './pokemon.mapper';
import { createPokemonResponse } from './testing/pokeapi-fixtures';

const FETCHED_AT = 1_700_000_000_000;

describe('mapPokemonResponse', () => {
  it('maps the identity, measurements, types and stats', () => {
    const pokemon = mapPokemonResponse(createPokemonResponse(), FETCHED_AT);

    expect(pokemon).toEqual({
      id: 25,
      name: 'pikachu',
      heightInMeters: 0.4,
      weightInKilograms: 6,
      types: ['electric'],
      stats: {
        hp: 35,
        attack: 55,
        defense: 40,
        specialAttack: 50,
        specialDefense: 50,
        speed: 90,
      },
      learnset: ['thunder-shock', 'quick-attack'],
      spriteUrl: 'official.png',
      fetchedAt: FETCHED_AT,
    });
  });

  it('removes duplicate moves from the learnset', () => {
    const response = createPokemonResponse({
      moves: [
        { move: { name: 'thunder-shock', url: '' }, version_group_details: [] },
        { move: { name: 'thunder-shock', url: '' }, version_group_details: [] },
        { move: { name: 'quick-attack', url: '' }, version_group_details: [] },
      ],
    });

    expect(mapPokemonResponse(response, FETCHED_AT).learnset).toEqual([
      'thunder-shock',
      'quick-attack',
    ]);
  });

  it('falls back to the front sprite when artwork is missing', () => {
    const response = createPokemonResponse({
      sprites: {
        ...createPokemonResponse().sprites,
        other: {
          ...createPokemonResponse().sprites.other,
          'official-artwork': { front_default: null, front_shiny: null },
        },
      },
    });

    expect(mapPokemonResponse(response, FETCHED_AT).spriteUrl).toBe('front.png');
  });

  it('returns null when no sprite is available', () => {
    const response = createPokemonResponse({
      sprites: {
        ...createPokemonResponse().sprites,
        front_default: null,
        other: {
          ...createPokemonResponse().sprites.other,
          'official-artwork': { front_default: null, front_shiny: null },
        },
      },
    });

    expect(mapPokemonResponse(response, FETCHED_AT).spriteUrl).toBeNull();
  });

  it('defaults missing stats to zero', () => {
    const response = createPokemonResponse({ stats: [] });

    expect(mapPokemonResponse(response, FETCHED_AT).stats).toEqual({
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    });
  });

  it('rejects unknown types', () => {
    const response = createPokemonResponse({
      types: [{ slot: 1, type: { name: 'cosmic', url: '' } }],
    });

    expect(() => mapPokemonResponse(response, FETCHED_AT)).toThrow('Unknown Pokémon type: cosmic');
  });
});
