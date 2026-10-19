export const POKEMON_PLACEHOLDER_SPRITE = '/placeholder-pokemon.svg';

export function pokemonSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function pokemonArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}
