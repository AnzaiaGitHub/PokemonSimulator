import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, from, switchMap } from 'rxjs';
import { PokemonTypeName } from '../../../../core/models';
import { AsyncState } from '../../../../shared/ui/async-state/async-state';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { PokedexStore } from '../../stores/pokedex.store';
import { PokemonCard } from '../../ui/pokemon-card/pokemon-card';

@Component({
  selector: 'app-pokemon-list-page',
  imports: [ReactiveFormsModule, AsyncState, Pagination, PokemonCard],
  templateUrl: './pokemon-list-page.html',
  styleUrl: './pokemon-list-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonListPage implements OnInit {
  protected readonly store = inject(PokedexStore);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly q = input('');

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly typeControl = new FormControl<PokemonTypeName | ''>('', {
    nonNullable: true,
  });

  constructor() {
    effect(() => {
      const query = this.q();
      this.store.setQuery(query);

      if (this.searchControl.value !== query) {
        this.searchControl.setValue(query, { emitEvent: false });
      }
    });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          this.store.setQuery(value);

          return from(
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { q: value.trim() || null },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.typeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.store.setType(value || null);
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  protected clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.typeControl.setValue('', { emitEvent: false });
    this.store.clearFilters();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
