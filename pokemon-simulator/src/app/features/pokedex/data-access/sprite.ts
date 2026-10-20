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
  private readonly references = new Map<number, number>();

  load(pokemonId: number, remoteUrl: string): Promise<string> {
    this.references.set(pokemonId, (this.references.get(pokemonId) ?? 0) + 1);

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
    const references = (this.references.get(pokemonId) ?? 1) - 1;

    if (references > 0) {
      this.references.set(pokemonId, references);
      return;
    }

    this.references.delete(pokemonId);

    const objectUrl = this.objectUrls.get(pokemonId);

    if (!objectUrl) {
      return;
    }

    URL.revokeObjectURL(objectUrl);
    this.objectUrls.delete(pokemonId);
  }

  async prefetch(pokemonId: number, remoteUrl: string): Promise<void> {
    const stored = await this.localDb.getSprite(pokemonId);

    if (stored) {
      return;
    }

    await this.download(pokemonId, remoteUrl);
  }

  private async resolve(pokemonId: number, remoteUrl: string): Promise<string> {
    const blob =
      (await this.localDb.getSprite(pokemonId))?.blob ??
      (await this.download(pokemonId, remoteUrl));

    const objectUrl = URL.createObjectURL(blob);
    this.objectUrls.set(pokemonId, objectUrl);

    return objectUrl;
  }

  private async download(pokemonId: number, remoteUrl: string): Promise<Blob> {
    if (!this.connectivity.isOnline()) {
      throw new NetworkError('The sprite is not available offline yet.');
    }

    const blob = await firstValueFrom(this.http.get(remoteUrl, { responseType: 'blob' }));
    await this.localDb.putSprite({ pokemonId, blob, fetchedAt: Date.now() });

    return blob;
  }
}
