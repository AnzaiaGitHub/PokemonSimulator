import { Move, Pokemon, PokemonTypeName } from '../../../core/models';
import {
  calculateDamage,
  CRITICAL_CHANCE,
  isDamagingMove,
  RANDOM_DAMAGE_MAX,
  RANDOM_DAMAGE_MIN,
} from './damage';
import { SeededRng } from './rng';
import { BATTLE_LEVEL, BattleStats, calculateBattleStats } from './stats';
import { TypeChart } from './type-effectiveness';
import { BattleWeather } from './weather';

export const BATTLE_SIDES = ['player', 'opponent'] as const;

export type BattleSide = (typeof BATTLE_SIDES)[number];

export const MAX_BATTLE_TURNS = 100;

export interface BattleFighter {
  readonly pokemon: Pokemon;
  readonly moves: readonly Move[];
  readonly stats: BattleStats;
  readonly maxHp: number;
  readonly currentHp: number;
}

export interface BattleLogEntry {
  readonly turn: number;
  readonly side: BattleSide;
  readonly attackerName: string;
  readonly defenderName: string;
  readonly moveName: string;
  readonly moveType: PokemonTypeName;
  readonly damage: number;
  readonly defenderHp: number;
  readonly defenderMaxHp: number;
  readonly critical: boolean;
  readonly stab: boolean;
  readonly typeMultiplier: number;
  readonly weatherMultiplier: number;
  readonly missed: boolean;
}

export interface BattleState {
  readonly player: BattleFighter;
  readonly opponent: BattleFighter;
  readonly weather: BattleWeather;
  readonly typeChart: TypeChart;
  readonly turn: number;
  readonly log: readonly BattleLogEntry[];
  readonly winner: BattleSide | null;
}

export interface BattleFighterSetup {
  readonly pokemon: Pokemon;
  readonly moves: readonly Move[];
  readonly level?: number;
}

export interface BattleSetup {
  readonly player: BattleFighterSetup;
  readonly opponent: BattleFighterSetup;
  readonly weather: BattleWeather;
}

export function createBattleFighter(setup: BattleFighterSetup): BattleFighter {
  const stats = calculateBattleStats(setup.pokemon.stats, setup.level ?? BATTLE_LEVEL);

  return {
    pokemon: setup.pokemon,
    moves: [...setup.moves],
    stats,
    maxHp: stats.hp,
    currentHp: stats.hp,
  };
}

export function createBattleState(setup: BattleSetup, typeChart: TypeChart): BattleState {
  return {
    player: createBattleFighter(setup.player),
    opponent: createBattleFighter(setup.opponent),
    weather: setup.weather,
    typeChart,
    turn: 1,
    log: [],
    winner: null,
  };
}

export function canFight(moves: readonly Move[]): boolean {
  return moves.some(isDamagingMove);
}

export function selectBestMove(
  attacker: BattleFighter,
  defender: BattleFighter,
  weather: BattleWeather,
  typeChart: TypeChart,
): Move | null {
  const damagingMoves = attacker.moves.filter(isDamagingMove);

  if (damagingMoves.length === 0) {
    return null;
  }

  let bestMove = damagingMoves[0];
  let bestDamage = -1;

  for (const move of damagingMoves) {
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

    if (
      breakdown.total > bestDamage ||
      (breakdown.total === bestDamage && move.name.localeCompare(bestMove.name) < 0)
    ) {
      bestDamage = breakdown.total;
      bestMove = move;
    }
  }

  return bestMove;
}

export function resolveTurn(state: BattleState, rng: SeededRng): BattleState {
  if (state.winner !== null) {
    return state;
  }

  let player = state.player;
  let opponent = state.opponent;
  let winner: BattleSide | null = null;
  const log = [...state.log];

  for (const side of turnOrder(state, rng)) {
    if (winner !== null) {
      break;
    }

    const attacker = side === 'player' ? player : opponent;
    const defender = side === 'player' ? opponent : player;

    if (attacker.currentHp <= 0 || defender.currentHp <= 0) {
      continue;
    }

    const move = selectBestMove(attacker, defender, state.weather, state.typeChart);

    if (!move) {
      continue;
    }

    const hits = move.accuracy === null || rng.integer(1, 100) <= move.accuracy;

    if (!hits) {
      log.push({
        turn: state.turn,
        side,
        attackerName: attacker.pokemon.name,
        defenderName: defender.pokemon.name,
        moveName: move.name,
        moveType: move.type,
        damage: 0,
        defenderHp: defender.currentHp,
        defenderMaxHp: defender.maxHp,
        critical: false,
        stab: attacker.pokemon.types.includes(move.type),
        typeMultiplier: 1,
        weatherMultiplier: 1,
        missed: true,
      });
      continue;
    }

    const critical = rng.chance(CRITICAL_CHANCE);
    const randomMultiplier =
      RANDOM_DAMAGE_MIN + rng.next() * (RANDOM_DAMAGE_MAX - RANDOM_DAMAGE_MIN);
    const breakdown = calculateDamage({
      attackerStats: attacker.stats,
      attackerTypes: attacker.pokemon.types,
      defenderStats: defender.stats,
      defenderTypes: defender.pokemon.types,
      move,
      weather: state.weather,
      typeChart: state.typeChart,
      critical,
      randomMultiplier,
    });
    const remainingHp = Math.max(0, defender.currentHp - breakdown.total);
    const updatedDefender: BattleFighter = { ...defender, currentHp: remainingHp };

    if (side === 'player') {
      opponent = updatedDefender;
    } else {
      player = updatedDefender;
    }

    log.push({
      turn: state.turn,
      side,
      attackerName: attacker.pokemon.name,
      defenderName: defender.pokemon.name,
      moveName: move.name,
      moveType: move.type,
      damage: breakdown.total,
      defenderHp: remainingHp,
      defenderMaxHp: defender.maxHp,
      critical,
      stab: breakdown.stabMultiplier > 1,
      typeMultiplier: breakdown.typeMultiplier,
      weatherMultiplier: breakdown.weatherMultiplier,
      missed: false,
    });

    if (remainingHp === 0) {
      winner = side;
    }
  }

  return {
    ...state,
    player,
    opponent,
    log,
    turn: state.turn + 1,
    winner,
  };
}

export function simulateBattle(
  state: BattleState,
  rng: SeededRng,
  maxTurns: number = MAX_BATTLE_TURNS,
): BattleState {
  let current = state;

  while (current.winner === null && current.turn <= maxTurns) {
    current = resolveTurn(current, rng);
  }

  if (current.winner !== null) {
    return current;
  }

  return settleTurnLimit(current);
}

function turnOrder(state: BattleState, rng: SeededRng): readonly [BattleSide, BattleSide] {
  if (state.player.stats.speed === state.opponent.stats.speed) {
    return rng.chance(0.5) ? ['player', 'opponent'] : ['opponent', 'player'];
  }

  return state.player.stats.speed > state.opponent.stats.speed
    ? ['player', 'opponent']
    : ['opponent', 'player'];
}

function settleTurnLimit(state: BattleState): BattleState {
  const playerRatio = state.player.currentHp / state.player.maxHp;
  const opponentRatio = state.opponent.currentHp / state.opponent.maxHp;

  if (playerRatio === opponentRatio) {
    return { ...state, winner: null };
  }

  return { ...state, winner: playerRatio > opponentRatio ? 'player' : 'opponent' };
}
