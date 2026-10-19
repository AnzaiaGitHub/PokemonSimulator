import { PokemonTypeName } from './pokemon-type.model';

export type MoveDamageClass = 'physical' | 'special' | 'status';

export interface Move {
  readonly id: number;
  readonly name: string;
  readonly type: PokemonTypeName;
  readonly damageClass: MoveDamageClass;
  readonly power: number | null;
  readonly accuracy: number | null;
  readonly pp: number | null;
  readonly priority: number;
  readonly fetchedAt: number;
}
