import { MoveResponse, PokemonResponse, TypeResponse } from '../../models/pokeapi';

export function createPokemonResponse(overrides: Partial<PokemonResponse> = {}): PokemonResponse {
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

export function createMoveResponse(overrides: Partial<MoveResponse> = {}): MoveResponse {
  return {
    id: 85,
    name: 'thunderbolt',
    accuracy: 100,
    effect_chance: 10,
    pp: 15,
    priority: 0,
    power: 90,
    type: { name: 'electric', url: '' },
    damage_class: { name: 'special', url: '' },
    target: { name: 'selected-pokemon', url: '' },
    generation: { name: 'generation-i', url: '' },
    effect_entries: [],
    flavor_text_entries: [],
    names: [],
    stat_changes: [],
    learned_by_pokemon: [],
    ...overrides,
  };
}

export function createTypeResponse(overrides: Partial<TypeResponse> = {}): TypeResponse {
  return {
    id: 13,
    name: 'electric',
    damage_relations: {
      double_damage_from: [{ name: 'ground', url: '' }],
      double_damage_to: [{ name: 'water', url: '' }],
      half_damage_from: [{ name: 'electric', url: '' }],
      half_damage_to: [{ name: 'grass', url: '' }],
      no_damage_from: [],
      no_damage_to: [{ name: 'ground', url: '' }],
    },
    generation: { name: 'generation-i', url: '' },
    move_damage_class: { name: 'special', url: '' },
    moves: [],
    pokemon: [],
    names: [],
    ...overrides,
  };
}
