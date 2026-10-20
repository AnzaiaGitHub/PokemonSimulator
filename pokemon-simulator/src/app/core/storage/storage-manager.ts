import { inject, Injectable, signal } from '@angular/core';
import { LocalDb } from '../database';

export interface StorageSnapshot {
  readonly usage: number | null;
  readonly quota: number | null;
  readonly persisted: boolean | null;
  readonly estimateSupported: boolean;
  readonly persistSupported: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class StorageManager {
  private readonly localDb = inject(LocalDb);
  private readonly _snapshot = signal<StorageSnapshot | null>(null);
  private readonly _busy = signal(false);

  readonly snapshot = this._snapshot.asReadonly();
  readonly busy = this._busy.asReadonly();

  async refresh(): Promise<void> {
    const storage = getStorage();

    if (!storage) {
      this._snapshot.set({
        usage: null,
        quota: null,
        persisted: null,
        estimateSupported: false,
        persistSupported: false,
      });

      return;
    }

    const estimate = storage.estimate ? await storage.estimate().catch(() => null) : null;
    const persisted = storage.persisted ? await storage.persisted().catch(() => null) : null;

    this._snapshot.set({
      usage: estimate?.usage ?? null,
      quota: estimate?.quota ?? null,
      persisted,
      estimateSupported: Boolean(storage.estimate),
      persistSupported: Boolean(storage.persist),
    });
  }

  async requestPersistent(): Promise<boolean> {
    const storage = getStorage();

    if (!storage?.persist) {
      return false;
    }

    this._busy.set(true);

    try {
      const granted = await storage.persist();
      await this.refresh();

      return granted;
    } finally {
      this._busy.set(false);
    }
  }

  async clearCache(): Promise<void> {
    this._busy.set(true);

    try {
      await this.localDb.clearCache();
      await this.refresh();
    } finally {
      this._busy.set(false);
    }
  }
}

function getStorage(): StorageManagerLike | null {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return null;
  }

  return navigator.storage as StorageManagerLike;
}

interface StorageManagerLike {
  readonly estimate?: () => Promise<StorageEstimate>;
  readonly persisted?: () => Promise<boolean>;
  readonly persist?: () => Promise<boolean>;
}
