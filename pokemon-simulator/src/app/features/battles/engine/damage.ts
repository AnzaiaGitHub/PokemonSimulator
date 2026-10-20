import { Move, PokemonTypeName } from '../../../core/models';
import { BATTLE_LEVEL, BattleStats } from './stats';
import { calculateTypeEffectiveness, TypeChart, TypeEffectivenessPart } from './type-effectiveness';
import { BattleWeather, getWeatherMultiplier } from './weather';

export const STAB_MULTIPLIER = 1.5;
export const CRITICAL_MULTIPLIER = 1.5;
export const CRITICAL_CHANCE = 1 / 24;
export const RANDOM_DAMAGE_MIN = 0.85;
export const RANDOM_DAMAGE_MAX = 1;

export interface DamageInput {
  readonly attackerStats: BattleStats;
  readonly attackerTypes: readonly PokemonTypeName[];
  readonly defenderStats: BattleStats;
  readonly defenderTypes: readonly PokemonTypeName[];
  readonly move: Move;
  readonly weather: BattleWeather;
  readonly typeChart: TypeChart;
  readonly critical: boolean;
  readonly randomMultiplier: number;
  readonly level?: number;
}

export interface DamageBreakdown {
  readonly baseDamage: number;
  readonly level: number;
  readonly power: number;
  readonly attackStat: number;
  readonly defenseStat: number;
  readonly attackStatName: 'attack' | 'specialAttack';
  readonly defenseStatName: 'defense' | 'specialDefense';
  readonly typeMultiplier: number;
  readonly typeParts: readonly TypeEffectivenessPart[];
  readonly stabMultiplier: number;
  readonly criticalMultiplier: number;
  readonly weatherMultiplier: number;
  readonly randomMultiplier: number;
  readonly total: number;
}

export function isDamagingMove(move: Move): boolean {
  return move.damageClass !== 'status' && (move.power ?? 0) > 0;
}

export function calculateDamage(input: DamageInput): DamageBreakdown {
  const level = input.level ?? BATTLE_LEVEL;
  const power = input.move.power ?? 0;

  if (!isDamagingMove(input.move)) {
    return {
      baseDamage: 0,
      level,
      power,
      attackStat: 0,
      defenseStat: 0,
      attackStatName: 'attack',
      defenseStatName: 'defense',
      typeMultiplier: 1,
      typeParts: [],
      stabMultiplier: 1,
      criticalMultiplier: 1,
      weatherMultiplier: 1,
      randomMultiplier: 1,
      total: 0,
    };
  }

  const isPhysical = input.move.damageClass === 'physical';
  const attackStat = isPhysical ? input.attackerStats.attack : input.attackerStats.specialAttack;
  const defenseStat = isPhysical ? input.defenderStats.defense : input.defenderStats.specialDefense;
  const attackStatName = isPhysical ? 'attack' : 'specialAttack';
  const defenseStatName = isPhysical ? 'defense' : 'specialDefense';

  const baseDamage =
    Math.floor((((2 * level) / 5 + 2) * power * attackStat) / defenseStat / 50) + 2;
  const typeEffectiveness = calculateTypeEffectiveness(
    input.move.type,
    input.defenderTypes,
    input.typeChart,
  );
  const stabMultiplier = input.attackerTypes.includes(input.move.type) ? STAB_MULTIPLIER : 1;
  const criticalMultiplier = input.critical ? CRITICAL_MULTIPLIER : 1;
  const weatherMultiplier = getWeatherMultiplier(input.weather, input.move.type);
  const randomMultiplier = clampRandom(input.randomMultiplier);
  const rawDamage =
    baseDamage *
    typeEffectiveness.multiplier *
    stabMultiplier *
    criticalMultiplier *
    weatherMultiplier *
    randomMultiplier;
  const total = typeEffectiveness.multiplier === 0 ? 0 : Math.max(1, Math.floor(rawDamage));

  return {
    baseDamage,
    level,
    power,
    attackStat,
    defenseStat,
    attackStatName,
    defenseStatName,
    typeMultiplier: typeEffectiveness.multiplier,
    typeParts: typeEffectiveness.parts,
    stabMultiplier,
    criticalMultiplier,
    weatherMultiplier,
    randomMultiplier,
    total,
  };
}

function clampRandom(value: number): number {
  if (!Number.isFinite(value)) {
    return RANDOM_DAMAGE_MAX;
  }

  return Math.min(RANDOM_DAMAGE_MAX, Math.max(RANDOM_DAMAGE_MIN, value));
}
