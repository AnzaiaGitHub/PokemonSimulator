import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Connectivity } from '../../../core/connectivity/connectivity';
import { TeamSlot } from '../../../core/models';
import { POKEDEX_REPOSITORY } from '../../pokedex/data-access/pokedex.repository';
import { SpriteService } from '../../pokedex/data-access/sprite';
import { pokemonArtworkUrl } from '../../pokedex/utils/pokemon-display';
import { MoveCatalog } from './move-catalog';

export type OfflineDownloadStatus = 'idle' | 'running' | 'success' | 'cancelled' | 'error';

@Injectable({
  providedIn: 'root',
})
export class TeamOfflineDownload {
  private readonly repository = inject(POKEDEX_REPOSITORY);
  private readonly sprites = inject(SpriteService);
  private readonly moveCatalog = inject(MoveCatalog);
  private readonly connectivity = inject(Connectivity);

  private readonly _status = signal<OfflineDownloadStatus>('idle');
  private readonly _completed = signal(0);
  private readonly _total = signal(0);
  private readonly _failed = signal(0);
  private readonly _message = signal<string | null>(null);
  private runId = 0;

  readonly status = this._status.asReadonly();
  readonly completed = this._completed.asReadonly();
  readonly total = this._total.asReadonly();
  readonly failed = this._failed.asReadonly();
  readonly message = this._message.asReadonly();
  readonly isRunning = computed(() => this._status() === 'running');
  readonly percent = computed(() => {
    const total = this._total();

    return total === 0 ? 0 : Math.round((this._completed() / total) * 100);
  });

  async start(slots: readonly (TeamSlot | null)[]): Promise<void> {
    if (this.isRunning()) {
      return;
    }

    const occupied = slots.filter((slot): slot is TeamSlot => slot !== null);

    if (occupied.length === 0) {
      this.fail('Add at least one Pokémon to your team before downloading it.');
      return;
    }

    if (!this.connectivity.isOnline()) {
      this.fail('You are offline. Connect to the internet to download your team.');
      return;
    }

    const runId = ++this.runId;
    const learnsets = uniqueNames(occupied.flatMap((slot) => slot.pokemon.learnset));
    const detailsAndSprites = occupied.length * 2;
    const total = detailsAndSprites + learnsets.length;
    let completed = 0;
    let failed = 0;
    const isCancelled = (): boolean => runId !== this.runId;

    this._status.set('running');
    this._completed.set(0);
    this._total.set(total);
    this._failed.set(0);
    this._message.set(null);

    for (const slot of occupied) {
      if (isCancelled()) {
        return;
      }

      try {
        await firstValueFrom(this.repository.getPokemon(slot.pokemon.name));
      } catch {
        failed += 1;
      }

      completed += 1;
      this.report(completed, failed);
    }

    for (const slot of occupied) {
      if (isCancelled()) {
        return;
      }

      try {
        const spriteUrl = slot.pokemon.spriteUrl ?? pokemonArtworkUrl(slot.pokemon.id);
        await this.sprites.prefetch(slot.pokemon.id, spriteUrl);
      } catch {
        failed += 1;
      }

      completed += 1;
      this.report(completed, failed);
    }

    if (isCancelled()) {
      return;
    }

    const result = await this.moveCatalog.loadMoves(
      learnsets,
      (progress) => {
        if (!isCancelled()) {
          this.report(
            detailsAndSprites + progress.loaded + progress.failed,
            failed + progress.failed,
          );
        }
      },
      isCancelled,
    );

    if (isCancelled()) {
      return;
    }

    const failedTotal = failed + result.failed.length;
    this._completed.set(detailsAndSprites + result.moves.length + result.failed.length);
    this._failed.set(failedTotal);

    if (result.moves.length === 0 && result.failed.length > 0) {
      this.fail('Could not download the moves for your team. Check your connection and try again.');
      return;
    }

    this._status.set('success');
    this._message.set(
      failedTotal > 0
        ? `Team saved for offline use. ${failedTotal} item${failedTotal === 1 ? '' : 's'} could not be downloaded.`
        : 'Team saved for offline use. You can now disconnect.',
    );
  }

  cancel(): void {
    if (!this.isRunning()) {
      return;
    }

    this.runId += 1;
    this._status.set('cancelled');
    this._message.set('Download cancelled. Data already saved was kept.');
  }

  private report(completed: number, failed: number): void {
    this._completed.set(Math.min(completed, this._total()));
    this._failed.set(failed);
  }

  private fail(message: string): void {
    this._status.set('error');
    this._message.set(message);
  }
}

function uniqueNames(names: readonly string[]): string[] {
  return [...new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean))];
}
