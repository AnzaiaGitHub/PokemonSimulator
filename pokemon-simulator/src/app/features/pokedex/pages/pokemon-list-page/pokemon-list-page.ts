import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
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

  constructor() {
    effect(() => {
      const query = this.q();
      this.store.setQuery(query);

      if (this.searchControl.value !== query) {
        this.searchControl.setValue(query, { emitEvent: false });
      }
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.store.setQuery(value);
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: value.trim() || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
  }

  ngOnInit(): void {
    this.store.load();
  }

  protected clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.store.clearQuery();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
