import { Move } from './move.model';
import { Pokemon } from './pokemon.model';

export interface TeamSlot {
  readonly pokemon: Pokemon;
  readonly moves: readonly Move[];
}
