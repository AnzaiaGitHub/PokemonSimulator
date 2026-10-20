import {
  BattleSetup,
  createBattleState,
  resolveTurn,
  selectBestMove,
  simulateBattle,
} from './battle';
import { createSeededRng, SeededRng } from './rng';
import { createMove, createPokemon, TEST_TYPE_CHART } from './testing/battle-fixtures';

function setup(): BattleSetup {
  return {
    player: {
      pokemon: createPokemon('pikachu', { types: ['electric'], stats: { speed: 120 } }),
      moves: [createMove('quick-attack', { power: 20, accuracy: null })],
    },
    opponent: {
      pokemon: createPokemon('bulbasaur', { types: ['grass'], stats: { speed: 80 } }),
      moves: [createMove('tackle', { power: 20, accuracy: null })],
    },
    weather: 'clear',
  };
}

function fixedRng(options: {
  readonly chance?: (probability: number) => boolean;
  readonly integer?: (min: number, max: number) => number;
  readonly next?: () => number;
}): SeededRng {
  return {
    chance: options.chance ?? (() => false),
    integer: options.integer ?? (() => 100),
    next: options.next ?? (() => 0.5),
  };
}

describe('battle turn resolution', () => {
  it('acts in speed order', () => {
    const state = createBattleState(setup(), TEST_TYPE_CHART);
    const result = resolveTurn(state, createSeededRng(1));

    expect(result.log.map((entry) => entry.side)).toEqual(['player', 'opponent']);
  });

  it('breaks speed ties with the seeded RNG', () => {
    const tie = setup();
    const tied: BattleSetup = {
      ...tie,
      player: { ...tie.player, pokemon: createPokemon('a', { stats: { speed: 100 } }) },
      opponent: { ...tie.opponent, pokemon: createPokemon('b', { stats: { speed: 100 } }) },
    };
    const state = createBattleState(tied, TEST_TYPE_CHART);

    const playerFirst = resolveTurn(
      state,
      fixedRng({ chance: (probability) => probability === 0.5 }),
    );
    const opponentFirst = resolveTurn(state, fixedRng({ chance: () => false }));

    expect(playerFirst.log[0].side).toBe('player');
    expect(opponentFirst.log[0].side).toBe('opponent');
  });

  it('records a miss when the accuracy check fails', () => {
    const missSetup = setup();
    const state = createBattleState(
      {
        ...missSetup,
        player: {
          ...missSetup.player,
          moves: [createMove('inaccurate', { accuracy: 0, power: 20 })],
        },
      },
      TEST_TYPE_CHART,
    );

    const result = resolveTurn(state, fixedRng({ integer: () => 100 }));

    expect(result.log[0]).toMatchObject({ side: 'player', missed: true, damage: 0 });
  });

  it('ends the battle when a Pokémon reaches 0 HP', () => {
    const state = createBattleState(
      {
        player: {
          pokemon: createPokemon('strong', {
            stats: { attack: 200, speed: 200 },
          }),
          moves: [createMove('nuke', { power: 250, accuracy: null })],
        },
        opponent: {
          pokemon: createPokemon('weak', { stats: { hp: 10, defense: 100, speed: 1 } }),
          moves: [createMove('tackle', { power: 20, accuracy: null })],
        },
        weather: 'clear',
      },
      TEST_TYPE_CHART,
    );

    const result = simulateBattle(state, createSeededRng(7));

    expect(result.winner).toBe('player');
    expect(result.opponent.currentHp).toBe(0);
    expect(result.log.length).toBeGreaterThan(0);
  });

  it('ignores status moves in this version', () => {
    const state = createBattleState(
      {
        player: {
          pokemon: createPokemon('a'),
          moves: [createMove('growl', { damageClass: 'status', power: null })],
        },
        opponent: {
          pokemon: createPokemon('b'),
          moves: [createMove('leer', { damageClass: 'status', power: null })],
        },
        weather: 'clear',
      },
      TEST_TYPE_CHART,
    );

    const result = resolveTurn(state, fixedRng({}));

    expect(result.log).toEqual([]);
    expect(result.turn).toBe(2);
  });

  it('is deterministic for the same seed', () => {
    const first = simulateBattle(createBattleState(setup(), TEST_TYPE_CHART), createSeededRng(123));
    const second = simulateBattle(
      createBattleState(setup(), TEST_TYPE_CHART),
      createSeededRng(123),
    );

    expect(second.winner).toBe(first.winner);
    expect(second.player.currentHp).toBe(first.player.currentHp);
    expect(second.opponent.currentHp).toBe(first.opponent.currentHp);
    expect(second.log).toEqual(first.log);
  });
});

describe('selectBestMove', () => {
  it('chooses the move with the highest expected damage', () => {
    const state = createBattleState(
      {
        player: {
          pokemon: createPokemon('attacker', { types: ['normal'] }),
          moves: [
            createMove('tackle', { power: 40 }),
            createMove('flamethrower', { power: 80, type: 'fire', damageClass: 'special' }),
          ],
        },
        opponent: {
          pokemon: createPokemon('defender', { types: ['grass'] }),
          moves: [createMove('tackle')],
        },
        weather: 'clear',
      },
      TEST_TYPE_CHART,
    );

    const move = selectBestMove(state.player, state.opponent, 'clear', TEST_TYPE_CHART);

    expect(move?.name).toBe('flamethrower');
  });
});
