import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BattleLogEntry } from '../../engine';
import {
  describeBattleLogEntry,
  formatEffectiveness,
  formatIdentifier,
} from '../../utils/battle-format';

@Component({
  selector: 'app-battle-log',
  imports: [],
  templateUrl: './battle-log.html',
  styleUrl: './battle-log.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleLog {
  readonly entries = input.required<readonly BattleLogEntry[]>();
  readonly emptyMessage = input('The battle log will appear here.');

  protected describe(entry: BattleLogEntry): string {
    return describeBattleLogEntry(entry);
  }

  protected moveName(entry: BattleLogEntry): string {
    return formatIdentifier(entry.moveName);
  }

  protected effectiveness(entry: BattleLogEntry): string {
    return formatEffectiveness(entry.typeMultiplier);
  }

  protected effectivenessClasses(multiplier: number): string {
    if (multiplier > 1) {
      return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30';
    }

    if (multiplier === 0) {
      return 'bg-slate-500/15 text-slate-300 ring-slate-500/30';
    }

    if (multiplier < 1) {
      return 'bg-amber-500/15 text-amber-300 ring-amber-500/30';
    }

    return 'bg-slate-500/15 text-slate-300 ring-slate-500/30';
  }
}
