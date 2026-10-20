import { inject, Injectable, InjectionToken } from '@angular/core';
import { defer, firstValueFrom, Observable } from 'rxjs';
import { Connectivity } from '../../../core/connectivity/connectivity';
import { LocalDb } from '../../../core/database';
import {
  isPokemonTypeName,
  Move,
  Pokemon,
  PokemonIndexEntry,
  PokemonType,
} from '../../../core/models';
import { DataResult, POKEDEX_CACHE_CONFIG, PokedexRepository } from './pokedex.repository';

export const POKEDEX_SOURCE = new InjectionToken<PokedexRepository>('PokedexSource');

const CACHE_VERSION = 2;
const POKEMON_INDEX_FETCHED_AT = 'pokemonIndexFetchedAt';

@Injectable()
export class LocalPokedexRepository implements PokedexRepository {
  private readonly localDb = inject(LocalDb);
  private readonly source = inject(POKEDEX_SOURCE);
  private readonly cacheConfig = inject(POKEDEX_CACHE_CONFIG);
  private readonly connectivity = inject(Connectivity);
  private readonly revalidating = new Set<string>();
  private cacheVersionReady: Promise<void> | null = null;

  getPokemonIndex(): Observable<DataResult<readonly PokemonIndexEntry[]>> {
    return defer(() => this.loadPokemonIndex());
  }

  getPokemon(nameOrId: string | number): Observable<DataResult<Pokemon>> {
    return defer(() => this.loadPokemon(nameOrId));
  }

  getMove(name: string): Observable<DataResult<Move>> {
    return defer(() => this.loadMove(name));
  }

  getType(name: string): Observable<DataResult<PokemonType>> {
    return defer(() => this.loadType(name));
  }

  private ensureCacheVersion(): Promise<void> {
    this.cacheVersionReady ??= this.resetOutdatedCache();

    return this.cacheVersionReady;
  }

  private async resetOutdatedCache(): Promise<void> {
    const version = await this.localDb.getMeta<number>('cacheVersion');

    if (version === CACHE_VERSION) {
      return;
    }

    await this.localDb.clearCache();
    await this.localDb.setMeta('cacheVersion', CACHE_VERSION);
  }

  private async loadPokemonIndex(): Promise<DataResult<readonly PokemonIndexEntry[]>> {
    await this.ensureCacheVersion();
    const cached = await this.localDb.getPokemonIndex();

    if (cached.length > 0) {
      const fetchedAt = await this.localDb.getMeta<number>(POKEMON_INDEX_FETCHED_AT);

      if (fetchedAt === undefined || this.isStale(fetchedAt)) {
        this.revalidate('pokemonIndex', async () => {
          const refreshed = await firstValueFrom(this.source.getPokemonIndex());
          await this.localDb.bulkPutPokemonIndex(refreshed.data);
          await this.localDb.setMeta(POKEMON_INDEX_FETCHED_AT, Date.now());
        });
      }

      return { data: cached, source: 'cache' };
    }

    const result = await firstValueFrom(this.source.getPokemonIndex());
    await this.localDb.bulkPutPokemonIndex(result.data);
    await this.localDb.setMeta(POKEMON_INDEX_FETCHED_AT, Date.now());

    return { data: result.data, source: 'network' };
  }

  private async loadPokemon(nameOrId: string | number): Promise<DataResult<Pokemon>> {
    await this.ensureCacheVersion();
    const key = String(nameOrId).trim().toLowerCase();
    const byName = await this.localDb.getPokemonByName(key);

    if (byName) {
      this.revalidatePokemon(byName);
      return { data: byName, source: 'cache' };
    }

    const numericId = Number(key);

    if (Number.isInteger(numericId) && numericId > 0) {
      const byId = await this.localDb.getPokemon(numericId);

      if (byId) {
        this.revalidatePokemon(byId);
        return { data: byId, source: 'cache' };
      }
    }

    const result = await firstValueFrom(this.source.getPokemon(nameOrId));
    await this.localDb.putPokemon(result.data);

    return { data: result.data, source: 'network' };
  }

  private async loadMove(name: string): Promise<DataResult<Move>> {
    await this.ensureCacheVersion();
    const key = name.trim().toLowerCase();
    const cached = await this.localDb.getMove(key);

    if (cached) {
      if (this.isStale(cached.fetchedAt)) {
        this.revalidate(`move:${key}`, async () => {
          const refreshed = await firstValueFrom(this.source.getMove(key));
          await this.localDb.putMove(refreshed.data);
        });
      }

      return { data: cached, source: 'cache' };
    }

    const result = await firstValueFrom(this.source.getMove(key));
    await this.localDb.putMove(result.data);

    return { data: result.data, source: 'network' };
  }

  private async loadType(name: string): Promise<DataResult<PokemonType>> {
    await this.ensureCacheVersion();
    const key = name.trim().toLowerCase();

    if (isPokemonTypeName(key)) {
      const cached = await this.localDb.getType(key);

      if (cached) {
        const fetchedAt = await this.localDb.getMeta<number>(typeFetchedAtKey(key));

        if (fetchedAt === undefined || this.isStale(fetchedAt)) {
          this.revalidate(`type:${key}`, async () => {
            const refreshed = await firstValueFrom(this.source.getType(key));
            await this.localDb.putType(refreshed.data);
            await this.localDb.setMeta(typeFetchedAtKey(key), Date.now());
          });
        }

        return { data: cached, source: 'cache' };
      }
    }

    const result = await firstValueFrom(this.source.getType(key));
    await this.localDb.putType(result.data);

    if (isPokemonTypeName(key)) {
      await this.localDb.setMeta(typeFetchedAtKey(key), Date.now());
    }

    return { data: result.data, source: 'network' };
  }

  private isStale(fetchedAt: number): boolean {
    return Date.now() - fetchedAt > this.cacheConfig.ttlMs;
  }

  private revalidatePokemon(pokemon: Pokemon): void {
    if (!this.isStale(pokemon.fetchedAt)) {
      return;
    }

    this.revalidate(`pokemon:${pokemon.name}`, async () => {
      const refreshed = await firstValueFrom(this.source.getPokemon(pokemon.name));
      await this.localDb.putPokemon(refreshed.data);
    });
  }

  private revalidate(key: string, refresh: () => Promise<void>): void {
    if (!this.connectivity.isOnline() || this.revalidating.has(key)) {
      return;
    }

    this.revalidating.add(key);

    void refresh()
      .catch(() => undefined)
      .finally(() => this.revalidating.delete(key));
  }
}

function typeFetchedAtKey(name: string): string {
  return `typeFetchedAt:${name}`;
}
