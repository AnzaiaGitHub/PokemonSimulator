import { pickBattleMoves, toggleBattleMove } from './move-selection';
import { createMove } from './testing/battle-fixtures';

describe('pickBattleMoves', () => {
  it('keeps only attacking moves, strongest first, up to four', () => {
    const moves = [
      createMove('ember', { power: 40, damageClass: 'special', type: 'fire' }),
      createMove('growl', { power: null, damageClass: 'status' }),
      createMove('flamethrower', { power: 90, damageClass: 'special', type: 'fire' }),
      createMove('tackle', { power: 40 }),
      createMove('scratch', { power: 40 }),
    ];

    expect(pickBattleMoves(moves).map((move) => move.name)).toEqual([
      'flamethrower',
      'ember',
      'scratch',
      'tackle',
    ]);
  });
});

describe('toggleBattleMove', () => {
  it('adds and removes a selected move', () => {
    const tackle = createMove('tackle');
    const ember = createMove('ember');

    const selected = toggleBattleMove([], tackle);

    expect(selected.map((move) => move.name)).toEqual(['tackle']);
    expect(toggleBattleMove(selected, tackle)).toEqual([]);
    expect(toggleBattleMove(selected, ember).map((move) => move.name)).toEqual(['tackle', 'ember']);
  });

  it('never selects more than four moves', () => {
    const selected = ['a', 'b', 'c', 'd'].map((name) => createMove(name));

    expect(toggleBattleMove(selected, createMove('e'))).toHaveLength(4);
  });
});
