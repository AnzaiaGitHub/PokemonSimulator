import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PokemonTypeBadge } from '../../../../shared/ui/pokemon-type-badge/pokemon-type-badge';
import { MatchupEntry } from '../../engine';
import { formatEffectiveness, formatIdentifier, formatPercent } from '../../utils/battle-format';

@Component({
  selector: 'app-battle-matchup-table',
  imports: [PokemonTypeBadge],
  templateUrl: './battle-matchup-table.html',
  styleUrl: './battle-matchup-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleMatchupTable {
  readonly title = input.required<string>();
  readonly defenderName = input.required<string>();
  readonly entries = input.required<readonly MatchupEntry[]>();

  protected moveName(entry: MatchupEntry): string {
    return formatIdentifier(entry.move.name);
  }

  protected effectiveness(entry: MatchupEntry): string {
    return formatEffectiveness(entry.typeMultiplier);
  }

  protected percent(entry: MatchupEntry): string {
    return formatPercent(entry.damagePercent);
  }

  protected effectivenessClasses(multiplier: number): string {
    if (multiplier > 1) {
      return 'text-emerald-300';
    }

    if (multiplier === 0) {
      return 'text-slate-400';
    }

    if (multiplier < 1) {
      return 'text-amber-300';
    }

    return 'text-slate-300';
  }
}
