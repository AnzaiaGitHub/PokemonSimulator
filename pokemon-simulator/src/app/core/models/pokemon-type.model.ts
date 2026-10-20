export const POKEMON_TYPE_NAMES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type PokemonTypeName = (typeof POKEMON_TYPE_NAMES)[number];

const POKEMON_TYPE_NAME_SET: ReadonlySet<string> = new Set(POKEMON_TYPE_NAMES);

export function isPokemonTypeName(value: string): value is PokemonTypeName {
  return POKEMON_TYPE_NAME_SET.has(value);
}

export function toPokemonTypeName(value: string): PokemonTypeName {
  if (!isPokemonTypeName(value)) {
    throw new Error(`Unknown Pokémon type: ${value}`);
  }

  return value;
}

export interface TypeDamageRelations {
  readonly noDamageFrom: readonly PokemonTypeName[];
  readonly halfDamageFrom: readonly PokemonTypeName[];
  readonly doubleDamageFrom: readonly PokemonTypeName[];
  readonly noDamageTo: readonly PokemonTypeName[];
  readonly halfDamageTo: readonly PokemonTypeName[];
  readonly doubleDamageTo: readonly PokemonTypeName[];
}

export interface PokemonType {
  readonly name: PokemonTypeName;
  readonly damageRelations: TypeDamageRelations;
  readonly pokemon: readonly string[];
}
