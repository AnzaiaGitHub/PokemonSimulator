import { Provider } from '@angular/core';
import { PokeApiSource } from './pokeapi.repository';
import { LocalPokedexRepository, POKEDEX_SOURCE } from './pokedex-local.repository';
import { POKEDEX_REPOSITORY } from './pokedex.repository';

export function providePokedexLocal(): Provider[] {
  return [
    {
      provide: POKEDEX_SOURCE,
      useClass: PokeApiSource,
    },
    {
      provide: POKEDEX_REPOSITORY,
      useClass: LocalPokedexRepository,
    },
  ];
}
