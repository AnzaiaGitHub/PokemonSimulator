import { NamedApiResource } from './named-api-resource.model';

export interface MoveResponse {
  readonly id: number;
  readonly name: string;
  readonly accuracy: number | null;
  readonly effect_chance: number | null;
  readonly pp: number | null;
  readonly priority: number;
  readonly power: number | null;
  readonly type: NamedApiResource;
  readonly damage_class: NamedApiResource;
  readonly target: NamedApiResource;
  readonly generation: NamedApiResource;
  readonly effect_entries: readonly MoveEffectEntry[];
  readonly flavor_text_entries: readonly MoveFlavorTextEntry[];
  readonly names: readonly MoveName[];
  readonly stat_changes: readonly MoveStatChange[];
  readonly learned_by_pokemon: readonly NamedApiResource[];
}

export interface MoveEffectEntry {
  readonly effect: string;
  readonly short_effect: string;
  readonly language: NamedApiResource;
}

export interface MoveFlavorTextEntry {
  readonly flavor_text: string;
  readonly language: NamedApiResource;
  readonly version_group: NamedApiResource;
}

export interface MoveName {
  readonly name: string;
  readonly language: NamedApiResource;
}

export interface MoveStatChange {
  readonly change: number;
  readonly stat: NamedApiResource;
}
