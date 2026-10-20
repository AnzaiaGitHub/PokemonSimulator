import {
  Move,
  Pokemon,
  PokemonStats,
  PokemonType,
  PokemonTypeName,
  TypeDamageRelations,
} from '../../../../core/models';
import { TypeChart } from '../type-effectiveness';

interface PokemonOverrides extends Partial<Omit<Pokemon, 'stats'>> {
  readonly stats?: Partial<PokemonStats>;
}

export function createMove(name: string, overrides: Partial<Omit<Move, 'name'>> = {}): Move {
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
    ...overrides,
  };
}

export function createPokemon(name: string, overrides: PokemonOverrides = {}): Pokemon {
  const { stats, ...rest } = overrides;

  return {
    id: 1,
    name,
    heightInMeters: 1,
    weightInKilograms: 10,
    types: ['normal'],
    stats: {
      hp: 100,
      attack: 100,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed: 100,
      ...stats,
    },
    learnset: [],
    spriteUrl: null,
    fetchedAt: 0,
    ...rest,
  };
}

export function createType(
  name: PokemonTypeName,
  damageRelations: Partial<TypeDamageRelations> = {},
): PokemonType {
  return {
    name,
    damageRelations: {
      noDamageFrom: [],
      halfDamageFrom: [],
      doubleDamageFrom: [],
      noDamageTo: [],
      halfDamageTo: [],
      doubleDamageTo: [],
      ...damageRelations,
    },
    pokemon: [],
  };
}

export function createTypeChart(types: readonly PokemonType[]): TypeChart {
  return new Map(types.map((type) => [type.name, type]));
}

export const TEST_TYPE_CHART = createTypeChart([
  createType('normal', { noDamageFrom: ['ghost'], doubleDamageFrom: ['fighting'] }),
  createType('fire', {
    halfDamageFrom: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
    doubleDamageFrom: ['water', 'ground', 'rock'],
  }),
  createType('water', {
    halfDamageFrom: ['fire', 'water', 'ice', 'steel'],
    doubleDamageFrom: ['electric', 'grass'],
  }),
  createType('grass', {
    halfDamageFrom: ['water', 'electric', 'grass', 'ground'],
    doubleDamageFrom: ['fire', 'ice', 'poison', 'flying', 'bug'],
  }),
  createType('ice', {
    halfDamageFrom: ['ice'],
    doubleDamageFrom: ['fire', 'fighting', 'rock', 'steel'],
  }),
  createType('electric', {
    halfDamageFrom: ['electric', 'flying', 'steel'],
    doubleDamageFrom: ['ground'],
  }),
  createType('ghost', {
    noDamageFrom: ['normal', 'fighting'],
    doubleDamageFrom: ['ghost', 'dark'],
  }),
  createType('ground', {
    noDamageFrom: ['electric'],
    doubleDamageFrom: ['water', 'grass', 'ice'],
  }),
  createType('flying', {
    halfDamageFrom: ['grass', 'fighting', 'bug'],
    doubleDamageFrom: ['electric', 'ice', 'rock'],
  }),
  createType('fighting', {
    doubleDamageFrom: ['flying', 'psychic', 'fairy'],
  }),
]);
