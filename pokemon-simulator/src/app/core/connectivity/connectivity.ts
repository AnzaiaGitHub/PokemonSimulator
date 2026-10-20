import { DestroyRef, inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Connectivity {
  private readonly _isOnline = signal(readOnlineState());

  readonly isOnline = this._isOnline.asReadonly();

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = (): void => this._isOnline.set(true);
    const handleOffline = (): void => this._isOnline.set(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }
}

function readOnlineState(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
