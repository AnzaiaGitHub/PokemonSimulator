import {
  Pokemon,
  PokemonType,
  PokemonTypeName,
  TeamSlot,
  TypeDamageRelations,
} from '../../../../core/models';
import { TeamSlots } from '../team.store';
import { computeTeamTypeSummary } from './team-summary.store';

function createDamageRelations(
  overrides: Partial<TypeDamageRelations> = {},
): TypeDamageRelations {
  return {
    noDamageFrom: [],
    halfDamageFrom: [],
    doubleDamageFrom: [],
    noDamageTo: [],
    halfDamageTo: [],
    doubleDamageTo: [],
    ...overrides,
  };
}

function createTypeSlot(types: PokemonTypeName[], name = 'test'): TeamSlot {
  const pokemon: Pokemon = {
    id: 1,
    name,
    heightInMeters: 1,
    weightInKilograms: 1,
    types,
    stats: {
      hp: 1,
      attack: 1,
      defense: 1,
      specialAttack: 1,
      specialDefense: 1,
      speed: 1,
    },
    learnset: [],
    spriteUrl: null,
    fetchedAt: 0,
  };

  return { pokemon, moves: [] };
}

function createSlots(...slots: (TeamSlot | null)[]): TeamSlots {
  const padded: (TeamSlot | null)[] = [...slots];
  while (padded.length < 6) {
    padded.push(null);
  }
  return padded;
}

function createType(
  name: PokemonTypeName,
  damageRelations: Partial<TypeDamageRelations> = {},
): PokemonType {
  return { name, damageRelations: createDamageRelations(damageRelations), pokemon: [] };
}

describe('computeTeamTypeSummary', () => {
  it('returns no analysis when the team is empty', () => {
    const summary = computeTeamTypeSummary(createSlots(), new Map());

    expect(summary).toEqual({
      presentTypes: [],
      weaknesses: [],
      resistances: [],
      immunities: [],
    });
  });

  it('lists the unique types present in the team', () => {
    const slots = createSlots(
      createTypeSlot(['electric'], 'pikachu'),
      createTypeSlot(['electric', 'flying'], 'zapdos'),
    );

    const summary = computeTeamTypeSummary(slots, new Map());

    expect(summary.presentTypes).toEqual(['electric', 'flying']);
  });

  it('does not report a team-wide immunity when another member is weak to the type', () => {
    const typeMap = new Map<PokemonTypeName, PokemonType>([
      ['normal', createType('normal', { doubleDamageFrom: ['fighting'] })],
      ['ghost', createType('ghost', { noDamageFrom: ['fighting'] })],
    ]);
    const slots = createSlots(createTypeSlot(['normal']), createTypeSlot(['ghost']));

    const summary = computeTeamTypeSummary(slots, typeMap);

    expect(summary.weaknesses).toContainEqual({ type: 'fighting', multiplier: 2 });
    expect(summary.immunities).toEqual([]);
  });

  it('reports an immunity only when every team member is immune', () => {
    const typeMap = new Map<PokemonTypeName, PokemonType>([
      ['ghost', createType('ghost', { noDamageFrom: ['fighting'] })],
    ]);
    const slots = createSlots(createTypeSlot(['ghost'], 'gastly'));

    const summary = computeTeamTypeSummary(slots, typeMap);

    expect(summary.immunities).toContain('fighting');
    expect(summary.weaknesses).toEqual([]);
  });

  it('multiplies resistances of dual types', () => {
    const typeMap = new Map<PokemonTypeName, PokemonType>([
      ['fire', createType('fire', { halfDamageFrom: ['grass'] })],
      ['flying', createType('flying', { halfDamageFrom: ['grass'] })],
    ]);
    const slots = createSlots(createTypeSlot(['fire', 'flying'], 'charizard'));

    const summary = computeTeamTypeSummary(slots, typeMap);

    expect(summary.resistances).toContainEqual({ type: 'grass', multiplier: 0.25 });
  });

  it('sorts weaknesses by descending multiplier', () => {
    const typeMap = new Map<PokemonTypeName, PokemonType>([
      ['normal', createType('normal', { doubleDamageFrom: ['fighting'] })],
      ['grass', createType('grass', { doubleDamageFrom: ['fire', 'ice'] })],
    ]);
    const slots = createSlots(createTypeSlot(['normal']), createTypeSlot(['grass']));

    const summary = computeTeamTypeSummary(slots, typeMap);

    expect(summary.weaknesses.map((entry) => entry.type)).toEqual(['fire', 'ice', 'fighting']);
  });
});
