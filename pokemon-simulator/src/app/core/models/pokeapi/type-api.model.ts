import { NamedApiResource } from './named-api-resource.model';

export interface TypeDamageRelationsResponse {
  readonly double_damage_from: readonly NamedApiResource[];
  readonly double_damage_to: readonly NamedApiResource[];
  readonly half_damage_from: readonly NamedApiResource[];
  readonly half_damage_to: readonly NamedApiResource[];
  readonly no_damage_from: readonly NamedApiResource[];
  readonly no_damage_to: readonly NamedApiResource[];
}

export interface TypeResponse {
  readonly id: number;
  readonly name: string;
  readonly damage_relations: TypeDamageRelationsResponse;
  readonly generation: NamedApiResource;
  readonly move_damage_class: NamedApiResource | null;
  readonly moves: readonly NamedApiResource[];
  readonly pokemon: readonly TypePokemon[];
  readonly names: readonly TypeName[];
}

export interface TypePokemon {
  readonly slot: number;
  readonly pokemon: NamedApiResource;
}

export interface TypeName {
  readonly name: string;
  readonly language: NamedApiResource;
}
