import { PokemonResponse } from '../models/pokeapi';
import { mapPokemonResponse } from './pokemon.mapper';

const FETCHED_AT = 1_700_000_000_000;

function createPokemonResponse(overrides: Partial<PokemonResponse> = {}): PokemonResponse {
  return {
    id: 25,
    name: 'pikachu',
    base_experience: 112,
    height: 4,
    weight: 60,
    order: 35,
    is_default: true,
    location_area_encounters: 'https://pokeapi.co/api/v2/pokemon/25/encounters',
    abilities: [],
    cries: { latest: 'latest.ogg', legacy: 'legacy.ogg' },
    forms: [],
    game_indices: [],
    held_items: [],
    moves: [
      { move: { name: 'thunder-shock', url: '' }, version_group_details: [] },
      { move: { name: 'quick-attack', url: '' }, version_group_details: [] },
    ],
    species: { name: 'pikachu', url: '' },
    sprites: {
      back_default: null,
      back_female: null,
      back_shiny: null,
      back_shiny_female: null,
      front_default: 'front.png',
      front_female: null,
      front_shiny: null,
      front_shiny_female: null,
      other: {
        dream_world: { front_default: null, front_female: null },
        home: {
          front_default: null,
          front_female: null,
          front_shiny: null,
          front_shiny_female: null,
        },
        'official-artwork': { front_default: 'official.png', front_shiny: null },
        showdown: {
          back_default: null,
          back_female: null,
          back_shiny: null,
          back_shiny_female: null,
          front_default: null,
          front_female: null,
          front_shiny: null,
          front_shiny_female: null,
        },
      },
      versions: {},
    },
    stats: [
      { base_stat: 35, effort: 0, stat: { name: 'hp', url: '' } },
      { base_stat: 55, effort: 0, stat: { name: 'attack', url: '' } },
      { base_stat: 40, effort: 0, stat: { name: 'defense', url: '' } },
      { base_stat: 50, effort: 0, stat: { name: 'special-attack', url: '' } },
      { base_stat: 50, effort: 0, stat: { name: 'special-defense', url: '' } },
      { base_stat: 90, effort: 2, stat: { name: 'speed', url: '' } },
    ],
    types: [{ slot: 1, type: { name: 'electric', url: '' } }],
    ...overrides,
  };
}

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
