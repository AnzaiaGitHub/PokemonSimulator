import { computed, inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PokemonIndexEntry } from '../../../core/models';
import { DataSource, POKEDEX_REPOSITORY } from '../data-access/pokedex.repository';

export type PokedexStatus = 'idle' | 'loading' | 'ready' | 'error';

export const POKEDEX_PAGE_SIZE = 20;

@Injectable({
  providedIn: 'root',
})
export class PokedexStore {
  private readonly repository = inject(POKEDEX_REPOSITORY);
  private loadSubscription: Subscription | null = null;

  private readonly _status = signal<PokedexStatus>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly _index = signal<readonly PokemonIndexEntry[]>([]);
  private readonly _dataSource = signal<DataSource | null>(null);
  private readonly _query = signal('');
  private readonly _page = signal(1);

  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly index = this._index.asReadonly();
  readonly dataSource = this._dataSource.asReadonly();
  readonly query = this._query.asReadonly();
  readonly page = this._page.asReadonly();

  readonly normalizedQuery = computed(() => (this._query() || '').trim().toLowerCase());

  readonly filteredPokemon = computed(() => {
    const query = this.normalizedQuery();

    if (!query || query == '') {
      return this._index();
    }

    return this._index().filter((pokemon) => pokemon.name.toLowerCase().includes(query));
  });

  readonly totalResults = computed(() => this.filteredPokemon().length);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalResults() / POKEDEX_PAGE_SIZE)),
  );

  readonly currentPage = computed(() => Math.min(this._page(), this.totalPages()));

  readonly pageItems = computed(() => {
    const start = (this.currentPage() - 1) * POKEDEX_PAGE_SIZE;

    return this.filteredPokemon().slice(start, start + POKEDEX_PAGE_SIZE);
  });

  readonly isLoading = computed(() => this._status() === 'loading');
  readonly isEmpty = computed(() => this._status() === 'ready' && this.totalResults() === 0);
  readonly hasResults = computed(() => this.totalResults() > 0);
  readonly canGoPrevious = computed(() => this.currentPage() > 1);
  readonly canGoNext = computed(() => this.currentPage() < this.totalPages());

  load(): void {
    this.loadSubscription?.unsubscribe();
    this._status.set('loading');
    this._error.set(null);

    this.loadSubscription = this.repository.getPokemonIndex().subscribe({
      next: ({ data, source }) => {
        this._index.set(data);
        this._dataSource.set(source);
        this._page.set(1);
        this._status.set('ready');
      },
      error: (error: unknown) => {
        this._error.set(toErrorMessage(error, 'Could not load the Pokédex.'));
        this._status.set('error');
      },
    });
  }

  retry(): void {
    this.load();
  }

  setQuery(value: string): void {
    this._query.set(value);
    this._page.set(1);
  }

  clearQuery(): void {
    this.setQuery('');
  }

  nextPage(): void {
    if (this.canGoNext()) {
      this._page.update((page) => page + 1);
    }
  }

  previousPage(): void {
    if (this.canGoPrevious()) {
      this._page.update((page) => page - 1);
    }
  }

  goToPage(page: number): void {
    const nextPage = Math.trunc(page);

    if (nextPage >= 1 && nextPage <= this.totalPages()) {
      this._page.set(nextPage);
    }
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
