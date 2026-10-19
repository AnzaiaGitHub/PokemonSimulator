import { PokemonTypeName } from './pokemon-type.model';

export interface PokemonStats {
  readonly hp: number;
  readonly attack: number;
  readonly defense: number;
  readonly specialAttack: number;
  readonly specialDefense: number;
  readonly speed: number;
}

export interface Pokemon {
  readonly id: number;
  readonly name: string;
  readonly heightInMeters: number;
  readonly weightInKilograms: number;
  readonly types: readonly PokemonTypeName[];
  readonly stats: PokemonStats;
  readonly learnset: readonly string[];
  readonly spriteUrl: string | null;
  readonly fetchedAt: number;
}
