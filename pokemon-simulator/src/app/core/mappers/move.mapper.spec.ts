import { MoveResponse } from '../models/pokeapi';
import { mapMoveResponse } from './move.mapper';
import { createMoveResponse } from './testing/pokeapi-fixtures';

const FETCHED_AT = 1_700_000_000_000;
const MOVE_RESPONSE: MoveResponse = createMoveResponse();

describe('mapMoveResponse', () => {
  it('maps the move to the domain model', () => {
    expect(mapMoveResponse(MOVE_RESPONSE, FETCHED_AT)).toEqual({
      id: 85,
      name: 'thunderbolt',
      type: 'electric',
      damageClass: 'special',
      power: 90,
      accuracy: 100,
      pp: 15,
      priority: 0,
      fetchedAt: FETCHED_AT,
    });
  });

  it('keeps nullable values as null', () => {
    const move = mapMoveResponse(
      { ...MOVE_RESPONSE, power: null, accuracy: null, pp: null },
      FETCHED_AT,
    );

    expect(move.power).toBeNull();
    expect(move.accuracy).toBeNull();
    expect(move.pp).toBeNull();
  });

  it('rejects unknown damage classes', () => {
    const response: MoveResponse = {
      ...MOVE_RESPONSE,
      damage_class: { name: 'mystic', url: '' },
    };

    expect(() => mapMoveResponse(response, FETCHED_AT)).toThrow(
      'Unknown move damage class: mystic',
    );
  });
});
