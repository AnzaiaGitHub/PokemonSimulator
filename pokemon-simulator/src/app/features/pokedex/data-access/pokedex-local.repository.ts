import { inject, Injectable, InjectionToken } from '@angular/core';
import { defer, firstValueFrom, Observable } from 'rxjs';
import { LocalDb } from '../../../core/database';
import {
  isPokemonTypeName,
  Move,
  Pokemon,
  PokemonIndexEntry,
  PokemonType,
} from '../../../core/models';
import { DataResult, PokedexRepository } from './pokedex.repository';

export const POKEDEX_SOURCE = new InjectionToken<PokedexRepository>('PokedexSource');

const CACHE_VERSION = 1;

@Injectable()
export class LocalPokedexRepository implements PokedexRepository {
  private readonly localDb = inject(LocalDb);
  private readonly source = inject(POKEDEX_SOURCE);
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
      return { data: cached, source: 'cache' };
    }

    const result = await firstValueFrom(this.source.getPokemonIndex());
    await this.localDb.bulkPutPokemonIndex(result.data);

    return { data: result.data, source: 'network' };
  }

  private async loadPokemon(nameOrId: string | number): Promise<DataResult<Pokemon>> {
    await this.ensureCacheVersion();
    const key = String(nameOrId).trim().toLowerCase();
    const byName = await this.localDb.getPokemonByName(key);

    if (byName) {
      return { data: byName, source: 'cache' };
    }

    const numericId = Number(key);

    if (Number.isInteger(numericId) && numericId > 0) {
      const byId = await this.localDb.getPokemon(numericId);

      if (byId) {
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
        return { data: cached, source: 'cache' };
      }
    }

    const result = await firstValueFrom(this.source.getType(key));
    await this.localDb.putType(result.data);

    return { data: result.data, source: 'network' };
  }
}
