import { Provider } from '@angular/core';
import { PokedexMockConfig, POKEDEX_MOCK_CONFIG } from './mock/pokedex-mock.config';
import { InMemoryPokedexRepository } from './mock/pokedex-mock.repository';
import { POKEDEX_SOURCE, LocalPokedexRepository } from './pokedex-local.repository';
import { POKEDEX_REPOSITORY } from './pokedex.repository';

export function providePokedexLocal(config: Partial<PokedexMockConfig> = {}): Provider[] {
  return [
    {
      provide: POKEDEX_MOCK_CONFIG,
      useValue: { delayMs: 300, fail: false, ...config },
    },
    {
      provide: POKEDEX_SOURCE,
      useClass: InMemoryPokedexRepository,
    },
    {
      provide: POKEDEX_REPOSITORY,
      useClass: LocalPokedexRepository,
    },
  ];
}
