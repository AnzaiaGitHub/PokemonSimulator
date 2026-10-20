import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BattleStore } from '../../stores/battle.store';
import { formatIdentifier, formatPercent } from '../../utils/battle-format';
import { BattleMatchupTable } from '../battle-matchup-table/battle-matchup-table';

@Component({
  selector: 'app-battle-analysis',
  imports: [BattleMatchupTable],
  templateUrl: './battle-analysis.html',
  styleUrl: './battle-analysis.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleAnalysis {
  private readonly store = inject(BattleStore);

  protected readonly playerMatchup = this.store.playerMatchup;
  protected readonly opponentMatchup = this.store.opponentMatchup;
  protected readonly canAnalyze = this.store.canStart;
  protected readonly status = this.store.analysisStatus;
  protected readonly completed = this.store.analysisCompleted;
  protected readonly total = this.store.analysisTotal;
  protected readonly percent = this.store.analysisPercent;
  protected readonly result = this.store.analysisResult;
  protected readonly error = this.store.analysisError;
  protected readonly isRunning = computed(() => this.status() === 'running');
  protected readonly battles = this.store.analysisBattles;

  protected readonly playerName = computed(() => {
    const name = this.store.player().pokemon?.name;

    return name ? formatIdentifier(name) : 'Player 1';
  });
  protected readonly opponentName = computed(() => {
    const name = this.store.opponent().pokemon?.name;

    return name ? formatIdentifier(name) : 'Player 2';
  });
  protected readonly winRate = computed(() => formatPercent(this.result()?.winRate ?? 0, 1));
  protected readonly averageTurns = computed(() => (this.result()?.averageTurns ?? 0).toFixed(1));
  protected readonly averageTurnsToWin = computed(() =>
    (this.result()?.averageTurnsToWin ?? 0).toFixed(1),
  );

  protected simulate(): void {
    this.store.analyze();
  }

  protected cancel(): void {
    this.store.cancelAnalysis();
  }
}
