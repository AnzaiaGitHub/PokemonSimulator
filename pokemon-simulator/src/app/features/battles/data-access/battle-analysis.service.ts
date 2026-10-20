import { computed, Injectable, signal } from '@angular/core';
import {
  createBattleSimulationRunner,
  DEFAULT_SIMULATION_BATTLES,
  SimulationSummary,
  TypeChart,
} from '../engine';
import { BattleSetup } from '../engine';
import { AnalysisOptions } from '../models/battle-ui.model';

export const ANALYSIS_BATCH_SIZE = 10;

export type BattleAnalysisStatus = 'idle' | 'running' | 'done' | 'cancelled' | 'error';

@Injectable({
  providedIn: 'root',
})
export class BattleAnalysisService {
  private readonly _status = signal<BattleAnalysisStatus>('idle');
  private readonly _completed = signal(0);
  private readonly _total = signal(0);
  private readonly _result = signal<SimulationSummary | null>(null);
  private readonly _error = signal<string | null>(null);
  private runId = 0;

  readonly status = this._status.asReadonly();
  readonly completed = this._completed.asReadonly();
  readonly total = this._total.asReadonly();
  readonly result = this._result.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isRunning = computed(() => this._status() === 'running');
  readonly percent = computed(() => {
    const total = this._total();

    return total === 0 ? 0 : Math.round((this._completed() / total) * 100);
  });

  async run(
    setup: BattleSetup,
    typeChart: TypeChart,
    options: AnalysisOptions = {},
  ): Promise<SimulationSummary | null> {
    if (this.isRunning()) {
      return this._result();
    }

    const battles = Math.max(1, Math.floor(options.battles ?? DEFAULT_SIMULATION_BATTLES));
    const runId = ++this.runId;
    const runner = createBattleSimulationRunner(setup, typeChart, {
      seed: options.seed ?? 1,
    });

    this._status.set('running');
    this._completed.set(0);
    this._total.set(battles);
    this._result.set(null);
    this._error.set(null);

    try {
      for (let completed = 0; completed < battles; completed += ANALYSIS_BATCH_SIZE) {
        if (runId !== this.runId) {
          return null;
        }

        const count = Math.min(ANALYSIS_BATCH_SIZE, battles - completed);
        const summary = runner.run(count);

        this._completed.set(completed + count);
        this._result.set(summary);

        await yieldToBrowser();
      }

      if (runId !== this.runId) {
        return null;
      }

      this._status.set('done');

      return this._result();
    } catch {
      if (runId === this.runId) {
        this._status.set('error');
        this._error.set('The battle simulation could not be completed.');
      }

      return null;
    }
  }

  cancel(): void {
    if (!this.isRunning()) {
      return;
    }

    this.runId += 1;
    this._status.set('cancelled');
  }

  reset(): void {
    this.runId += 1;
    this._status.set('idle');
    this._completed.set(0);
    this._total.set(0);
    this._result.set(null);
    this._error.set(null);
  }
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, 0);
  });
}
