import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { StorageManager } from '../../../../core/storage/storage-manager';
import { PokemonTypeCache } from '../../../pokedex/data-access/pokemon-type-cache';

@Component({
  selector: 'app-settings-page',
  imports: [],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  protected readonly storage = inject(StorageManager);
  private readonly typeCache = inject(PokemonTypeCache);

  protected readonly showClearConfirmation = signal(false);
  protected readonly message = signal<string | null>(null);

  protected readonly usageLabel = computed(() => formatBytes(this.storage.snapshot()?.usage));
  protected readonly quotaLabel = computed(() => formatBytes(this.storage.snapshot()?.quota));
  protected readonly usagePercent = computed(() => {
    const snapshot = this.storage.snapshot();

    if (!snapshot?.usage || !snapshot.quota) {
      return null;
    }

    return Math.min(100, Math.round((snapshot.usage / snapshot.quota) * 100));
  });

  ngOnInit(): void {
    void this.storage.refresh();
  }

  protected async requestPersistent(): Promise<void> {
    const granted = await this.storage.requestPersistent();
    this.message.set(
      granted
        ? 'Persistent storage granted. Your data is less likely to be evicted.'
        : 'Persistent storage was not granted by the browser.',
    );
  }

  protected askToClearCache(): void {
    this.message.set(null);
    this.showClearConfirmation.set(true);
  }

  protected cancelClearCache(): void {
    this.showClearConfirmation.set(false);
  }

  protected async clearCache(): Promise<void> {
    await this.storage.clearCache();
    this.typeCache.reset();
    this.showClearConfirmation.set(false);
    this.message.set('Cached data cleared. Teams and trainers were kept.');
  }
}

function formatBytes(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Unavailable';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'] as const;
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
