import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { POKEMON_TYPE_NAMES } from '../../../core/models';
import { POKEDEX_REPOSITORY } from './pokedex.repository';

export type TypeCacheStatus = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({
  providedIn: 'root',
})
export class PokemonTypeCache {
  private readonly repository = inject(POKEDEX_REPOSITORY);
  private readonly _status = signal<TypeCacheStatus>('idle');
  private started = false;

  readonly status = this._status.asReadonly();

  loadAll(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this._status.set('loading');

    const requests = POKEMON_TYPE_NAMES.map((name) =>
      firstValueFrom(this.repository.getType(name)),
    );

    void Promise.allSettled(requests).then((results) => {
      const loaded = results.some((result) => result.status === 'fulfilled');

      if (!loaded) {
        this.started = false;
      }

      this._status.set(loaded ? 'ready' : 'error');
    });
  }

  reset(): void {
    this.started = false;
    this._status.set('idle');
  }
}
