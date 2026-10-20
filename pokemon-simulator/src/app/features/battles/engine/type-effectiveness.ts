import { PokemonType, PokemonTypeName } from '../../../core/models';

export type TypeChart = ReadonlyMap<PokemonTypeName, PokemonType>;

export interface TypeEffectivenessPart {
  readonly type: PokemonTypeName;
  readonly multiplier: number;
}

export interface TypeEffectiveness {
  readonly multiplier: number;
  readonly parts: readonly TypeEffectivenessPart[];
}

export function calculateTypeEffectiveness(
  attackingType: PokemonTypeName,
  defendingTypes: readonly PokemonTypeName[],
  typeChart: TypeChart,
): TypeEffectiveness {
  const parts: TypeEffectivenessPart[] = [];
  let multiplier = 1;

  for (const defendingType of defendingTypes) {
    const factor = getTypeMultiplier(attackingType, defendingType, typeChart);
    multiplier *= factor;
    parts.push({ type: defendingType, multiplier: factor });
  }

  return { multiplier, parts };
}

function getTypeMultiplier(
  attackingType: PokemonTypeName,
  defendingType: PokemonTypeName,
  typeChart: TypeChart,
): number {
  const type = typeChart.get(defendingType);

  if (!type) {
    return 1;
  }

  if (type.damageRelations.noDamageFrom.includes(attackingType)) {
    return 0;
  }

  if (type.damageRelations.halfDamageFrom.includes(attackingType)) {
    return 0.5;
  }

  if (type.damageRelations.doubleDamageFrom.includes(attackingType)) {
    return 2;
  }

  return 1;
}
