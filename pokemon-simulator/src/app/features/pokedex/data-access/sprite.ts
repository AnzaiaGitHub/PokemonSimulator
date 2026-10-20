import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Connectivity } from '../../../core/connectivity/connectivity';
import { LocalDb } from '../../../core/database';
import { NetworkError } from '../../../core/errors/data-error';

@Injectable({
  providedIn: 'root',
})
export class SpriteService {
  private readonly http = inject(HttpClient);
  private readonly localDb = inject(LocalDb);
  private readonly connectivity = inject(Connectivity);
  private readonly objectUrls = new Map<number, string>();
  private readonly pending = new Map<number, Promise<string>>();

  load(pokemonId: number, remoteUrl: string): Promise<string> {
    const cachedUrl = this.objectUrls.get(pokemonId);

    if (cachedUrl) {
      return Promise.resolve(cachedUrl);
    }

    const pending = this.pending.get(pokemonId);

    if (pending) {
      return pending;
    }

    const request = this.resolve(pokemonId, remoteUrl).finally(() => {
      this.pending.delete(pokemonId);
    });

    this.pending.set(pokemonId, request);

    return request;
  }

  release(pokemonId: number): void {
    const objectUrl = this.objectUrls.get(pokemonId);

    if (!objectUrl) {
      return;
    }

    URL.revokeObjectURL(objectUrl);
    this.objectUrls.delete(pokemonId);
  }

  private async resolve(pokemonId: number, remoteUrl: string): Promise<string> {
    let blob = (await this.localDb.getSprite(pokemonId))?.blob;

    if (!blob) {
      if (!this.connectivity.isOnline()) {
        throw new NetworkError('The sprite is not available offline yet.');
      }

      blob = await firstValueFrom(this.http.get(remoteUrl, { responseType: 'blob' }));
      await this.localDb.putSprite({ pokemonId, blob, fetchedAt: Date.now() });
    }

    const objectUrl = URL.createObjectURL(blob);
    this.objectUrls.set(pokemonId, objectUrl);

    return objectUrl;
  }
}
