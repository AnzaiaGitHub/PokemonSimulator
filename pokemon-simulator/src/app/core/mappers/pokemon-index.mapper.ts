import { PokemonIndexEntry } from '../models';
import { PokemonListResponse } from '../models/pokeapi';

export function mapPokemonIndexResponse(
  response: PokemonListResponse,
): readonly PokemonIndexEntry[] {
  return response.results.flatMap((resource) => {
    const id = extractPokemonId(resource.url);

    return id === null ? [] : [{ id, name: resource.name }];
  });
}

function extractPokemonId(url: string): number | null {
  const match = /\/(\d+)\/?$/.exec(url);

  if (!match) {
    return null;
  }

  const id = Number(match[1]);

  return Number.isInteger(id) && id > 0 ? id : null;
}
