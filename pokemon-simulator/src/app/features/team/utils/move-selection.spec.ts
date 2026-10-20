import { Move } from '../../../core/models';
import {
  formatMoveName,
  hasAttackingMove,
  MAX_MOVES_PER_POKEMON,
  maxMovesValidator,
  pickDefaultMoves,
  uniqueMovesValidator,
} from './move-selection';

function createMove(name: string, overrides: Partial<Omit<Move, 'name'>> = {}): Move {
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

describe('pickDefaultMoves', () => {
  it('picks the four strongest attack moves', () => {
    const moves = [
      createMove('tackle', { power: 40 }),
      createMove('flamethrower', { power: 90, damageClass: 'special' }),
      createMove('growl', { power: null, damageClass: 'status' }),
      createMove('quick-attack', { power: 40 }),
      createMove('fire-blast', { power: 110, damageClass: 'special' }),
      createMove('ember', { power: 40, damageClass: 'special' }),
      createMove('scratch', { power: 40 }),
    ];

    const defaults = pickDefaultMoves(moves);

    expect(defaults.map((move) => move.name)).toEqual([
      'fire-blast',
      'flamethrower',
      'ember',
      'quick-attack',
    ]);
  });

  it('ignores status moves and moves without power', () => {
    const moves = [
      createMove('growl', { power: null, damageClass: 'status' }),
      createMove('tackle', { power: 40 }),
      createMove('splash', { power: null, damageClass: 'status' }),
    ];

    expect(pickDefaultMoves(moves).map((move) => move.name)).toEqual(['tackle']);
  });
});

describe('hasAttackingMove', () => {
  it('is true when at least one move is physical or special', () => {
    expect(
      hasAttackingMove([createMove('growl', { damageClass: 'status' }), createMove('tackle')]),
    ).toBe(true);
  });

  it('is false when every move is status', () => {
    expect(hasAttackingMove([createMove('growl', { damageClass: 'status' })])).toBe(false);
  });
});

describe('move validators', () => {
  it('accepts up to four moves', () => {
    const validator = maxMovesValidator();

    expect(validator({ value: ['a', 'b', 'c', 'd'] } as never)).toBeNull();
    expect(validator({ value: ['a', 'b', 'c', 'd', 'e'] } as never)).toEqual({
      maxMoves: { max: MAX_MOVES_PER_POKEMON, actual: 5 },
    });
  });

  it('rejects duplicate move names ignoring case', () => {
    const validator = uniqueMovesValidator();

    expect(validator({ value: ['tackle', 'Tackle'] } as never)).toEqual({
      duplicateMoves: true,
    });
    expect(validator({ value: ['tackle', 'growl'] } as never)).toBeNull();
  });
});

describe('formatMoveName', () => {
  it('turns kebab-case names into readable labels', () => {
    expect(formatMoveName('thunder-shock')).toBe('Thunder Shock');
  });
});
