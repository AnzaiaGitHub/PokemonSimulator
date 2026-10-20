import { computed, inject, Injectable, signal } from '@angular/core';
import { POKEMON_TYPE_NAMES, PokemonType, PokemonTypeName } from '../../../../core/models';
import { PokemonTypeCache } from '../../../pokedex/data-access/pokemon-type-cache';
import { TeamSlots, TeamStore } from '../team.store';

export interface TypeEffectiveness {
  readonly type: PokemonTypeName;
  readonly multiplier: number;
}

export interface TeamTypeSummary {
  readonly presentTypes: readonly PokemonTypeName[];
  readonly weaknesses: readonly TypeEffectiveness[];
  readonly resistances: readonly TypeEffectiveness[];
  readonly immunities: readonly PokemonTypeName[];
}

function calculateTypeMultiplier(
  attackingType: PokemonTypeName,
  defendingTypes: readonly PokemonTypeName[],
  typeMap: ReadonlyMap<PokemonTypeName, PokemonType>,
): number {
  let multiplier = 1;

  for (const defType of defendingTypes) {
    const typeData = typeMap.get(defType);
    if (!typeData) continue;

    if (typeData.damageRelations.noDamageFrom.includes(attackingType)) {
      return 0;
    }
    if (typeData.damageRelations.halfDamageFrom.includes(attackingType)) {
      multiplier *= 0.5;
    }
    if (typeData.damageRelations.doubleDamageFrom.includes(attackingType)) {
      multiplier *= 2;
    }
  }

  return multiplier;
}

export function computeTeamTypeSummary(
  slots: TeamSlots,
  typeMap: ReadonlyMap<PokemonTypeName, PokemonType>,
): TeamTypeSummary {
  const presentTypeSet = new Set<PokemonTypeName>();
  for (const slot of slots) {
    if (slot) {
      for (const type of slot.pokemon.types) {
        presentTypeSet.add(type);
      }
    }
  }
  const presentTypes = [...presentTypeSet].sort();

  const hasPokemon = slots.some((slot) => slot !== null);
  if (typeMap.size === 0 || !hasPokemon) {
    return { presentTypes, weaknesses: [], resistances: [], immunities: [] };
  }

  const weaknesses: TypeEffectiveness[] = [];
  const resistances: TypeEffectiveness[] = [];
  const immunities: PokemonTypeName[] = [];

  for (const attackingType of POKEMON_TYPE_NAMES) {
    let maxMultiplier = 1;
    let minMultiplier = 1;
    let hasNonImmuneMatchup = false;
    let hasImmuneMatchup = false;

    for (const slot of slots) {
      if (!slot) continue;

      const multiplier = calculateTypeMultiplier(attackingType, slot.pokemon.types, typeMap);

      if (multiplier === 0) {
        hasImmuneMatchup = true;
        continue;
      }

      hasNonImmuneMatchup = true;
      maxMultiplier = Math.max(maxMultiplier, multiplier);
      minMultiplier = Math.min(minMultiplier, multiplier);
    }

    if (hasNonImmuneMatchup && maxMultiplier > 1) {
      weaknesses.push({ type: attackingType, multiplier: maxMultiplier });
    }
    if (hasNonImmuneMatchup && minMultiplier < 1) {
      resistances.push({ type: attackingType, multiplier: minMultiplier });
    }
    if (hasImmuneMatchup && !hasNonImmuneMatchup) {
      immunities.push(attackingType);
    }
  }

  return {
    presentTypes,
    weaknesses: weaknesses.sort((a, b) => b.multiplier - a.multiplier),
    resistances: resistances.sort((a, b) => a.multiplier - b.multiplier),
    immunities: immunities.sort(),
  };
}

@Injectable({
  providedIn: 'root',
})
export class TeamSummaryStore {
  private readonly teamStore = inject(TeamStore);
  private readonly typeCache = inject(PokemonTypeCache);
  private readonly _status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');

  readonly status = this._status.asReadonly();

  readonly presentTypes = computed(() => {
    const types = new Set<PokemonTypeName>();
    for (const slot of this.teamStore.slots()) {
      if (slot) {
        for (const type of slot.pokemon.types) {
          types.add(type);
        }
      }
    }
    return [...types].sort();
  });

  readonly summary = computed((): TeamTypeSummary =>
    computeTeamTypeSummary(this.teamStore.slots(), this.typeCache.types()),
  );

  async load(): Promise<void> {
    if (this._status() === 'ready' || this._status() === 'loading') {
      return;
    }

    this._status.set('loading');

    try {
      await this.typeCache.loadAll();
      this._status.set('ready');
    } catch {
      this._status.set('error');
    }
  }
}