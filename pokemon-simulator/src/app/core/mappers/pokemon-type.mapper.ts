import { NamedApiResource, TypeResponse } from '../models/pokeapi';
import { PokemonType, PokemonTypeName, toPokemonTypeName } from '../models/pokemon-type.model';

export function mapTypeResponse(response: TypeResponse): PokemonType {
  return {
    name: toPokemonTypeName(response.name),
    damageRelations: {
      noDamageFrom: mapTypeNames(response.damage_relations.no_damage_from),
      halfDamageFrom: mapTypeNames(response.damage_relations.half_damage_from),
      doubleDamageFrom: mapTypeNames(response.damage_relations.double_damage_from),
      noDamageTo: mapTypeNames(response.damage_relations.no_damage_to),
      halfDamageTo: mapTypeNames(response.damage_relations.half_damage_to),
      doubleDamageTo: mapTypeNames(response.damage_relations.double_damage_to),
    },
    pokemon: response.pokemon.map((entry) => entry.pokemon.name),
  };
}

function mapTypeNames(resources: readonly NamedApiResource[]): readonly PokemonTypeName[] {
  return resources.map((resource) => toPokemonTypeName(resource.name));
}
