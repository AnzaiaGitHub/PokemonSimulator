import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  template: `
    <nav
      aria-label="Pokedex pagination"
      class="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 sm:flex-row"
    >
      <p class="text-xs font-medium text-slate-400" aria-live="polite">
        Page {{ page() }} of {{ totalPages() }} · {{ totalResults() }} Pokémon
      </p>

      <div class="flex items-center gap-2">
        <button
          type="button"
          [disabled]="page() <= 1"
          (click)="previous()"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          [disabled]="page() >= totalPages()"
          (click)="next()"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalResults = input.required<number>();
  readonly pageChange = output<number>();

  protected previous(): void {
    if (this.page() > 1) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  protected next(): void {
    if (this.page() < this.totalPages()) {
      this.pageChange.emit(this.page() + 1);
    }
  }
}
