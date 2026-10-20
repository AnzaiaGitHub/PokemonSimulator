import {
  buildMatchup,
  createBattleSimulationRunner,
  simulateBattles,
  SimulationSummary,
} from './analysis';
import { BattleSetup, createBattleFighter } from './battle';
import { calculateDamage } from './damage';
import { createMove, createPokemon, TEST_TYPE_CHART } from './testing/battle-fixtures';

function strongSetup(): BattleSetup {
  return {
    player: {
      pokemon: createPokemon('strong', { stats: { attack: 200, speed: 200 } }),
      moves: [createMove('nuke', { power: 250, accuracy: null })],
    },
    opponent: {
      pokemon: createPokemon('weak', { stats: { hp: 10, defense: 100, speed: 1 } }),
      moves: [createMove('tackle', { power: 20, accuracy: null })],
    },
    weather: 'clear',
  };
}

describe('buildMatchup', () => {
  it('lists the expected damage and effectiveness of every attack', () => {
    const attacker = createBattleFighter({
      pokemon: createPokemon('charizard', { types: ['fire'] }),
      moves: [createMove('flamethrower', { power: 80, type: 'fire', damageClass: 'special' })],
    });
    const defender = createBattleFighter({
      pokemon: createPokemon('bulbasaur', { types: ['grass', 'ice'] }),
      moves: [createMove('tackle')],
    });

    const [entry] = buildMatchup(attacker, defender, 'clear', TEST_TYPE_CHART);
    const expected = calculateDamage({
      attackerStats: attacker.stats,
      attackerTypes: attacker.pokemon.types,
      defenderStats: defender.stats,
      defenderTypes: defender.pokemon.types,
      move: entry.move,
      weather: 'clear',
      typeChart: TEST_TYPE_CHART,
      critical: false,
      randomMultiplier: 1,
    });

    expect(entry.typeMultiplier).toBe(4);
    expect(entry.stab).toBe(true);
    expect(entry.expectedDamage).toBe(expected.total);
    expect(entry.damagePercent).toBeCloseTo(expected.total / defender.maxHp);
  });

  it('orders moves by expected damage', () => {
    const attacker = createBattleFighter({
      pokemon: createPokemon('mixed', { types: ['normal'] }),
      moves: [
        createMove('tackle', { power: 40 }),
        createMove('flamethrower', { power: 80, type: 'fire', damageClass: 'special' }),
      ],
    });
    const defender = createBattleFighter({
      pokemon: createPokemon('target', { types: ['grass'] }),
      moves: [createMove('tackle')],
    });

    const matchup = buildMatchup(attacker, defender, 'clear', TEST_TYPE_CHART);

    expect(matchup.map((entry) => entry.move.name)).toEqual(['flamethrower', 'tackle']);
  });
});

describe('simulateBattles', () => {
  it('counts wins, losses and average turns for a fixed seed', () => {
    const summary = simulateBattles(strongSetup(), TEST_TYPE_CHART, {
      battles: 20,
      seed: 5,
    });

    expect(summary.battles).toBe(20);
    expect(summary.wins).toBe(20);
    expect(summary.losses).toBe(0);
    expect(summary.draws).toBe(0);
    expect(summary.winRate).toBe(1);
    expect(summary.averageTurnsToWin).toBeGreaterThan(0);
  });

  it('returns the same summary for the same seed', () => {
    const first = simulateBattles(strongSetup(), TEST_TYPE_CHART, {
      battles: 10,
      seed: 99,
    });
    const second = simulateBattles(strongSetup(), TEST_TYPE_CHART, {
      battles: 10,
      seed: 99,
    });

    expect(second).toEqual(first);
  });

  it('produces the same total when run in batches', () => {
    const runner = createBattleSimulationRunner(strongSetup(), TEST_TYPE_CHART, {
      seed: 9,
    });

    runner.run(4);
    const batched = runner.run(6);
    const single = simulateBattles(strongSetup(), TEST_TYPE_CHART, {
      battles: 10,
      seed: 9,
    });

    expect(batched).toEqual(single);
  });

  it('can report draws when no Pokémon is knocked out before the turn limit', () => {
    const setup: BattleSetup = {
      player: {
        pokemon: createPokemon('a'),
        moves: [createMove('growl', { damageClass: 'status', power: null })],
      },
      opponent: {
        pokemon: createPokemon('b'),
        moves: [createMove('leer', { damageClass: 'status', power: null })],
      },
      weather: 'clear',
    };
    const summary: SimulationSummary = simulateBattles(setup, TEST_TYPE_CHART, {
      battles: 1,
      seed: 1,
      maxTurns: 1,
    });

    expect(summary.battles).toBe(1);
    expect(summary.draws).toBe(1);
    expect(summary.winRate).toBe(0);
  });
});
