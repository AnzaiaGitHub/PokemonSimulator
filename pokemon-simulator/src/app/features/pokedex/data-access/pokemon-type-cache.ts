import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { POKEMON_TYPE_NAMES, PokemonType, PokemonTypeName } from '../../../core/models';
import { POKEDEX_REPOSITORY } from './pokedex.repository';

export type TypeCacheStatus = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({
  providedIn: 'root',
})
export class PokemonTypeCache {
  private readonly repository = inject(POKEDEX_REPOSITORY);
  private readonly _status = signal<TypeCacheStatus>('idle');
  private readonly _types = signal<ReadonlyMap<PokemonTypeName, PokemonType>>(new Map());
  private loadPromise: Promise<void> | null = null;

  readonly status = this._status.asReadonly();
  readonly types = this._types.asReadonly();

  readonly typeEntries = computed(() => [...this._types().entries()]);

  loadAll(): Promise<void> {
    if (this._status() === 'ready') {
      return Promise.resolve();
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this._status.set('loading');

    this.loadPromise = (async () => {
      const requests = POKEMON_TYPE_NAMES.map((name) =>
        firstValueFrom(this.repository.getType(name)),
      );

      const results = await Promise.allSettled(requests);
      const map = new Map<PokemonTypeName, PokemonType>();

      for (const result of results) {
        if (result.status === 'fulfilled') {
          map.set(result.value.data.name, result.value.data);
        }
      }

      this._types.set(map);
      this._status.set(map.size > 0 ? 'ready' : 'error');
      this.loadPromise = null;
    })();

    return this.loadPromise;
  }

  reset(): void {
    this._types.set(new Map());
    this._status.set('idle');
    this.loadPromise = null;
  }
}
