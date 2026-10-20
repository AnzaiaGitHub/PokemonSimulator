import { PokemonStats } from '../../../core/models';

export const BATTLE_LEVEL = 50;

export interface BattleStats {
  readonly hp: number;
  readonly attack: number;
  readonly defense: number;
  readonly specialAttack: number;
  readonly specialDefense: number;
  readonly speed: number;
}

export function calculateHpStat(baseHp: number, level: number = BATTLE_LEVEL): number {
  return Math.floor((2 * baseHp * level) / 100) + level + 10;
}

export function calculateOtherStat(baseStat: number, level: number = BATTLE_LEVEL): number {
  return Math.floor((2 * baseStat * level) / 100) + 5;
}

export function calculateBattleStats(
  baseStats: PokemonStats,
  level: number = BATTLE_LEVEL,
): BattleStats {
  return {
    hp: calculateHpStat(baseStats.hp, level),
    attack: calculateOtherStat(baseStats.attack, level),
    defense: calculateOtherStat(baseStats.defense, level),
    specialAttack: calculateOtherStat(baseStats.specialAttack, level),
    specialDefense: calculateOtherStat(baseStats.specialDefense, level),
    speed: calculateOtherStat(baseStats.speed, level),
  };
}
