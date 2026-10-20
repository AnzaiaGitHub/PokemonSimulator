import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TeamSummaryStore } from '../../stores/team-summary/team-summary.store';
import { PokemonTypeBadge } from '../../../../shared/ui/pokemon-type-badge/pokemon-type-badge';

@Component({
  selector: 'app-team-summary',
  imports: [PokemonTypeBadge],
  templateUrl: './team-summary.html',
  styleUrl: './team-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSummary {
  private readonly summaryStore = inject(TeamSummaryStore);

  readonly summary = this.summaryStore.summary;
  readonly status = this.summaryStore.status;

  private readonly _expandedWeaknesses = signal(false);
  private readonly _expandedResistances = signal(false);
  private readonly _expandedImmunities = signal(false);

  readonly expandedWeaknesses = this._expandedWeaknesses.asReadonly();
  readonly expandedResistances = this._expandedResistances.asReadonly();
  readonly expandedImmunities = this._expandedImmunities.asReadonly();

  readonly weaknessCount = computed(() => this.summary().weaknesses.length);
  readonly resistanceCount = computed(() => this.summary().resistances.length);
  readonly immunityCount = computed(() => this.summary().immunities.length);

  toggleWeaknesses(): void {
    this._expandedWeaknesses.update((v) => !v);
  }

  toggleResistances(): void {
    this._expandedResistances.update((v) => !v);
  }

  toggleImmunities(): void {
    this._expandedImmunities.update((v) => !v);
  }

  protected getMultiplierLabel(multiplier: number): string {
    if (multiplier >= 4) return '4×';
    if (multiplier >= 2) return '2×';
    if (multiplier >= 1.5) return '1.5×';
    if (multiplier >= 1) return '1×';
    if (multiplier >= 0.5) return '½×';
    if (multiplier > 0) return '¼×';
    return '0×';
  }

  protected getMultiplierColor(multiplier: number): string {
    if (multiplier > 1) return 'text-red-300';
    if (multiplier < 1) return 'text-green-300';
    return 'text-slate-400';
  }
}