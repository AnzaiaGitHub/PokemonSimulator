import { Move } from '../../../core/models';
import {
  BattleFighter,
  BattleSetup,
  createBattleState,
  MAX_BATTLE_TURNS,
  simulateBattle,
} from './battle';
import { calculateDamage, isDamagingMove } from './damage';
import { createSeededRng } from './rng';
import { TypeChart, TypeEffectivenessPart } from './type-effectiveness';
import { BattleWeather } from './weather';

export const DEFAULT_SIMULATION_BATTLES = 100;

export interface MatchupEntry {
  readonly move: Move;
  readonly expectedDamage: number;
  readonly damagePercent: number;
  readonly typeMultiplier: number;
  readonly typeParts: readonly TypeEffectivenessPart[];
  readonly stab: boolean;
  readonly weatherMultiplier: number;
}

export interface SimulationOptions {
  readonly battles?: number;
  readonly seed?: number;
  readonly maxTurns?: number;
}

export interface SimulationSummary {
  readonly battles: number;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
  readonly winRate: number;
  readonly averageTurns: number;
  readonly averageTurnsToWin: number;
}

export interface BattleSimulationRunner {
  run(count: number): SimulationSummary;
}

export function buildMatchup(
  attacker: BattleFighter,
  defender: BattleFighter,
  weather: BattleWeather,
  typeChart: TypeChart,
): readonly MatchupEntry[] {
  return attacker.moves
    .filter(isDamagingMove)
    .map((move) => {
      const breakdown = calculateDamage({
        attackerStats: attacker.stats,
        attackerTypes: attacker.pokemon.types,
        defenderStats: defender.stats,
        defenderTypes: defender.pokemon.types,
        move,
        weather,
        typeChart,
        critical: false,
        randomMultiplier: 1,
      });

      return {
        move,
        expectedDamage: breakdown.total,
        damagePercent: defender.maxHp === 0 ? 0 : breakdown.total / defender.maxHp,
        typeMultiplier: breakdown.typeMultiplier,
        typeParts: breakdown.typeParts,
        stab: breakdown.stabMultiplier > 1,
        weatherMultiplier: breakdown.weatherMultiplier,
      };
    })
    .sort((a, b) => b.expectedDamage - a.expectedDamage || a.move.name.localeCompare(b.move.name));
}

export function createBattleSimulationRunner(
  setup: BattleSetup,
  typeChart: TypeChart,
  options: SimulationOptions = {},
): BattleSimulationRunner {
  const rng = createSeededRng(options.seed ?? 1);
  const maxTurns = options.maxTurns ?? MAX_BATTLE_TURNS;
  let battles = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalTurns = 0;
  let totalTurnsToWin = 0;

  const run = (count: number): SimulationSummary => {
    const requested = Math.max(0, Math.floor(count));

    for (let index = 0; index < requested; index += 1) {
      const initial = createBattleState(setup, typeChart);
      const result = simulateBattle(initial, rng, maxTurns);
      const turns = Math.max(1, result.turn - 1);

      battles += 1;
      totalTurns += turns;

      if (result.winner === 'player') {
        wins += 1;
        totalTurnsToWin += turns;
      } else if (result.winner === 'opponent') {
        losses += 1;
      } else {
        draws += 1;
      }
    }

    return {
      battles,
      wins,
      losses,
      draws,
      winRate: battles === 0 ? 0 : wins / battles,
      averageTurns: battles === 0 ? 0 : totalTurns / battles,
      averageTurnsToWin: wins === 0 ? 0 : totalTurnsToWin / wins,
    };
  };

  return { run };
}

export function simulateBattles(
  setup: BattleSetup,
  typeChart: TypeChart,
  options: SimulationOptions = {},
): SimulationSummary {
  return createBattleSimulationRunner(setup, typeChart, options).run(
    options.battles ?? DEFAULT_SIMULATION_BATTLES,
  );
}
