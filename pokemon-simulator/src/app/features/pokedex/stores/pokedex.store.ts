import { computed, inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { POKEMON_TYPE_NAMES, PokemonIndexEntry, PokemonTypeName } from '../../../core/models';
import { DataSource, POKEDEX_REPOSITORY } from '../data-access/pokedex.repository';
import { PokemonTypeCache } from '../data-access/pokemon-type-cache';

export type PokedexStatus = 'idle' | 'loading' | 'ready' | 'error';
export type TypeFilterStatus = 'idle' | 'loading' | 'ready' | 'error';

export const POKEDEX_PAGE_SIZE = 20;

@Injectable({
  providedIn: 'root',
})
export class PokedexStore {
  private readonly repository = inject(POKEDEX_REPOSITORY);
  private readonly typeCache = inject(PokemonTypeCache);
  private loadSubscription: Subscription | null = null;
  private typeSubscription: Subscription | null = null;

  private readonly _status = signal<PokedexStatus>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly _index = signal<readonly PokemonIndexEntry[]>([]);
  private readonly _dataSource = signal<DataSource | null>(null);
  private readonly _query = signal('');
  private readonly _page = signal(1);
  private readonly _selectedType = signal<PokemonTypeName | null>(null);
  private readonly _typePokemon = signal<ReadonlySet<string> | null>(null);
  private readonly _typeStatus = signal<TypeFilterStatus>('idle');
  private readonly _typeError = signal<string | null>(null);

  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly index = this._index.asReadonly();
  readonly dataSource = this._dataSource.asReadonly();
  readonly query = this._query.asReadonly();
  readonly page = this._page.asReadonly();
  readonly selectedType = this._selectedType.asReadonly();
  readonly typeStatus = this._typeStatus.asReadonly();
  readonly typeError = this._typeError.asReadonly();
  readonly availableTypes = POKEMON_TYPE_NAMES;

  readonly normalizedQuery = computed(() => (this._query() || '').trim().toLowerCase());

  readonly filteredPokemon = computed(() => {
    const query = this.normalizedQuery();
    const typePokemon = this._typePokemon();
    const filtered = typePokemon
      ? this._index().filter((pokemon) => typePokemon.has(pokemon.name))
      : this._index();

    if (!query || query == '') {
      return filtered;
    }

    return filtered.filter((pokemon) => pokemon.name.toLowerCase().includes(query));
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
  readonly isEmpty = computed(
    () =>
      this._status() === 'ready' && this._typeStatus() !== 'loading' && this.totalResults() === 0,
  );
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
        this.typeCache.loadAll();
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

  setType(type: PokemonTypeName | null): void {
    this.typeSubscription?.unsubscribe();
    this._selectedType.set(type);
    this._typePokemon.set(null);
    this._typeError.set(null);
    this._page.set(1);

    if (!type) {
      this._typeStatus.set('idle');
      return;
    }

    this._typeStatus.set('loading');

    this.typeSubscription = this.repository.getType(type).subscribe({
      next: ({ data }) => {
        if (this._selectedType() !== type) {
          return;
        }

        this._typePokemon.set(new Set(data.pokemon));
        this._typeStatus.set('ready');
      },
      error: (error: unknown) => {
        if (this._selectedType() !== type) {
          return;
        }

        this._typeError.set(toErrorMessage(error, 'Could not filter by type.'));
        this._typeStatus.set('error');
      },
    });
  }

  clearFilters(): void {
    this.clearQuery();
    this.setType(null);
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
