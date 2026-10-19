import { MoveResponse } from '../models/pokeapi';
import { Move, MoveDamageClass } from '../models/move.model';
import { toPokemonTypeName } from '../models/pokemon-type.model';

export function mapMoveResponse(response: MoveResponse, fetchedAt: number): Move {
  return {
    id: response.id,
    name: response.name,
    type: toPokemonTypeName(response.type.name),
    damageClass: toMoveDamageClass(response.damage_class.name),
    power: response.power,
    accuracy: response.accuracy,
    pp: response.pp,
    priority: response.priority,
    fetchedAt,
  };
}

function toMoveDamageClass(value: string): MoveDamageClass {
  if (value === 'physical' || value === 'special' || value === 'status') {
    return value;
  }

  throw new Error(`Unknown move damage class: ${value}`);
}
