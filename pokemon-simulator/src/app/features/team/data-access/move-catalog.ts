import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LocalDb } from '../../../core/database';
import { Move } from '../../../core/models';
import { POKEDEX_REPOSITORY } from '../../pokedex/data-access/pokedex.repository';

export const MOVE_LOAD_CONCURRENCY = 4;

export interface MoveLoadProgress {
  readonly loaded: number;
  readonly failed: number;
  readonly total: number;
}

export interface MoveLoadResult {
  readonly moves: readonly Move[];
  readonly failed: readonly string[];
}

@Injectable({
  providedIn: 'root',
})
export class MoveCatalog {
  private readonly repository = inject(POKEDEX_REPOSITORY);
  private readonly localDb = inject(LocalDb);
  private readonly cache = new Map<string, Move>();
  private readonly pending = new Map<string, Promise<Move>>();

  async getCachedMoves(names: readonly string[]): Promise<readonly Move[]> {
    const uniqueNames = uniqueLowercase(names);
    const stored = await Promise.all(
      uniqueNames.map(async (name) => this.cache.get(name) ?? (await this.localDb.getMove(name))),
    );

    return stored.filter((move): move is Move => {
      if (!move) {
        return false;
      }

      this.cache.set(move.name, move);

      return true;
    });
  }

  async loadMoves(
    names: readonly string[],
    onProgress?: (progress: MoveLoadProgress) => void,
    isCancelled?: () => boolean,
  ): Promise<MoveLoadResult> {
    const uniqueNames = uniqueLowercase(names);
    const moves = new Array<Move | undefined>(uniqueNames.length);
    const failed: string[] = [];
    let nextIndex = 0;
    let loaded = 0;
    let failures = 0;

    const worker = async (): Promise<void> => {
      while (nextIndex < uniqueNames.length) {
        if (isCancelled?.()) {
          return;
        }

        const index = nextIndex;
        nextIndex += 1;
        const name = uniqueNames[index];

        try {
          moves[index] = await this.loadMove(name);
          loaded += 1;
        } catch {
          failures += 1;
          failed.push(name);
        }

        if (isCancelled?.()) {
          return;
        }

        onProgress?.({ loaded, failed: failures, total: uniqueNames.length });
      }
    };

    const workerCount = Math.min(MOVE_LOAD_CONCURRENCY, uniqueNames.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return {
      moves: moves.filter((move): move is Move => move !== undefined),
      failed,
    };
  }

  private loadMove(name: string): Promise<Move> {
    const key = name.trim().toLowerCase();
    const cached = this.cache.get(key);

    if (cached) {
      return Promise.resolve(cached);
    }

    const pending = this.pending.get(key);

    if (pending) {
      return pending;
    }

    const request = this.resolve(key).finally(() => this.pending.delete(key));
    this.pending.set(key, request);

    return request;
  }

  private async resolve(name: string): Promise<Move> {
    const stored = await this.localDb.getMove(name);

    if (stored) {
      this.cache.set(name, stored);

      return stored;
    }

    const { data } = await firstValueFrom(this.repository.getMove(name));
    this.cache.set(name, data);

    return data;
  }
}

function uniqueLowercase(names: readonly string[]): string[] {
  return [...new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean))];
}
