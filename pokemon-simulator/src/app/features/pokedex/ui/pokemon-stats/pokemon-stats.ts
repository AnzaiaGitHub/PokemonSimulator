import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PokemonStats } from '../../../../core/models';

interface StatRow {
  readonly label: string;
  readonly value: number;
}

@Component({
  selector: 'app-pokemon-stats',
  imports: [],
  templateUrl: './pokemon-stats.html',
  styleUrl: './pokemon-stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonStatsComponent {
  readonly stats = input.required<PokemonStats>();

  protected readonly rows = computed<readonly StatRow[]>(() => {
    const stats = this.stats();

    return [
      { label: 'HP', value: stats.hp },
      { label: 'Attack', value: stats.attack },
      { label: 'Defense', value: stats.defense },
      { label: 'Sp. Atk', value: stats.specialAttack },
      { label: 'Sp. Def', value: stats.specialDefense },
      { label: 'Speed', value: stats.speed },
    ];
  });

  protected readonly maxValue = computed(() => Math.max(...this.rows().map((row) => row.value), 1));

  protected percentage(value: number): number {
    return Math.round((value / this.maxValue()) * 100);
  }
}
