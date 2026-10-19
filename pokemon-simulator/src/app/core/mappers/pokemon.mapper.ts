import { PokemonResponse } from '../models/pokeapi';
import { Pokemon, PokemonStats } from '../models/pokemon.model';
import { toPokemonTypeName } from '../models/pokemon-type.model';

export function mapPokemonResponse(response: PokemonResponse, fetchedAt: number): Pokemon {
  return {
    id: response.id,
    name: response.name,
    heightInMeters: response.height / 10,
    weightInKilograms: response.weight / 10,
    types: response.types.map((entry) => toPokemonTypeName(entry.type.name)),
    stats: mapStats(response),
    learnset: [...new Set(response.moves.map((entry) => entry.move.name))],
    spriteUrl:
      response.sprites.other['official-artwork'].front_default ?? response.sprites.front_default,
    fetchedAt,
  };
}

function mapStats(response: PokemonResponse): PokemonStats {
  return {
    hp: findBaseStat(response, 'hp'),
    attack: findBaseStat(response, 'attack'),
    defense: findBaseStat(response, 'defense'),
    specialAttack: findBaseStat(response, 'special-attack'),
    specialDefense: findBaseStat(response, 'special-defense'),
    speed: findBaseStat(response, 'speed'),
  };
}

function findBaseStat(response: PokemonResponse, statName: string): number {
  return response.stats.find((entry) => entry.stat.name === statName)?.base_stat ?? 0;
}
