import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Move, Pokemon, PokemonIndexEntry, PokemonType } from '../../../core/models';

export type DataSource = 'cache' | 'network';

export interface PokedexCacheConfig {
  readonly ttlMs: number;
}

export const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const POKEDEX_CACHE_CONFIG = new InjectionToken<PokedexCacheConfig>('PokedexCacheConfig', {
  providedIn: 'root',
  factory: () => ({ ttlMs: DEFAULT_CACHE_TTL_MS }),
});

export interface DataResult<T> {
  readonly data: T;
  readonly source: DataSource;
}

export interface PokedexRepository {
  getPokemonIndex(): Observable<DataResult<readonly PokemonIndexEntry[]>>;
  getPokemon(nameOrId: string | number): Observable<DataResult<Pokemon>>;
  getMove(name: string): Observable<DataResult<Move>>;
  getType(name: string): Observable<DataResult<PokemonType>>;
}

export const POKEDEX_REPOSITORY = new InjectionToken<PokedexRepository>('PokedexRepository');
