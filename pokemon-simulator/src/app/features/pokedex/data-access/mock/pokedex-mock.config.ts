import { InjectionToken, Provider } from '@angular/core';
import { POKEDEX_REPOSITORY } from '../pokedex.repository';
import { InMemoryPokedexRepository } from './pokedex-mock.repository';

export interface PokedexMockConfig {
  readonly delayMs: number;
  readonly fail: boolean;
}

export const POKEDEX_MOCK_CONFIG = new InjectionToken<PokedexMockConfig>('PokedexMockConfig', {
  providedIn: 'root',
  factory: () => ({ delayMs: 300, fail: false }),
});

export function providePokedexMock(config: Partial<PokedexMockConfig> = {}): Provider[] {
  return [
    {
      provide: POKEDEX_MOCK_CONFIG,
      useValue: { delayMs: 300, fail: false, ...config },
    },
    {
      provide: POKEDEX_REPOSITORY,
      useClass: InMemoryPokedexRepository,
    },
  ];
}
