import { TypeResponse } from '../models/pokeapi';
import { mapTypeResponse } from './pokemon-type.mapper';

const TYPE_RESPONSE: TypeResponse = {
  id: 13,
  name: 'electric',
  damage_relations: {
    double_damage_from: [{ name: 'ground', url: '' }],
    double_damage_to: [{ name: 'water', url: '' }],
    half_damage_from: [
      { name: 'electric', url: '' },
      { name: 'flying', url: '' },
      { name: 'steel', url: '' },
    ],
    half_damage_to: [
      { name: 'electric', url: '' },
      { name: 'grass', url: '' },
      { name: 'dragon', url: '' },
    ],
    no_damage_from: [],
    no_damage_to: [{ name: 'ground', url: '' }],
  },
  generation: { name: 'generation-i', url: '' },
  move_damage_class: { name: 'special', url: '' },
  moves: [],
  pokemon: [
    { slot: 1, pokemon: { name: 'pikachu', url: '' } },
    { slot: 2, pokemon: { name: 'raichu', url: '' } },
  ],
  names: [],
};

describe('mapTypeResponse', () => {
  it('maps the type and all its damage relations and Pokémon', () => {
    expect(mapTypeResponse(TYPE_RESPONSE)).toEqual({
      name: 'electric',
      damageRelations: {
        noDamageFrom: [],
        halfDamageFrom: ['electric', 'flying', 'steel'],
        doubleDamageFrom: ['ground'],
        noDamageTo: ['ground'],
        halfDamageTo: ['electric', 'grass', 'dragon'],
        doubleDamageTo: ['water'],
      },
      pokemon: ['pikachu', 'raichu'],
    });
  });

  it('rejects unknown types', () => {
    expect(() => mapTypeResponse({ ...TYPE_RESPONSE, name: 'cosmic' })).toThrow(
      'Unknown Pokémon type: cosmic',
    );
  });
});
