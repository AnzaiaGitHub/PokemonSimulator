import { PokemonTypeName } from '../../../core/models';

export const BATTLE_WEATHER_IDS = ['clear', 'sun', 'rain'] as const;

export type BattleWeather = (typeof BATTLE_WEATHER_IDS)[number];

export interface BattleWeatherDefinition {
  readonly id: BattleWeather;
  readonly label: string;
  readonly description: string;
  readonly typeMultipliers: Partial<Record<PokemonTypeName, number>>;
}

export const BATTLE_WEATHERS: readonly BattleWeatherDefinition[] = [
  {
    id: 'clear',
    label: 'Clear',
    description: 'No weather effects.',
    typeMultipliers: {},
  },
  {
    id: 'sun',
    label: 'Sun',
    description: 'Fire moves ×1.5 and Water moves ×0.5.',
    typeMultipliers: { fire: 1.5, water: 0.5 },
  },
  {
    id: 'rain',
    label: 'Rain',
    description: 'Water moves ×1.5 and Fire moves ×0.5.',
    typeMultipliers: { water: 1.5, fire: 0.5 },
  },
];

const WEATHER_BY_ID: ReadonlyMap<BattleWeather, BattleWeatherDefinition> = new Map(
  BATTLE_WEATHERS.map((weather) => [weather.id, weather]),
);

export function getBattleWeather(weather: BattleWeather): BattleWeatherDefinition {
  return WEATHER_BY_ID.get(weather) ?? BATTLE_WEATHERS[0];
}

export function getWeatherMultiplier(weather: BattleWeather, type: PokemonTypeName): number {
  return getBattleWeather(weather).typeMultipliers[type] ?? 1;
}
