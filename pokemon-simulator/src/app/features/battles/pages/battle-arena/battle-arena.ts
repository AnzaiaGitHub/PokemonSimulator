import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { getBattleWeather } from '../../engine';
import { BattleStore } from '../../stores/battle.store';
import { BattleAnalysis } from '../../ui/battle-analysis/battle-analysis';
import { BattleFighterConfig } from '../../ui/battle-fighter-config/battle-fighter-config';
import { BattleFighterPanel } from '../../ui/battle-fighter-panel/battle-fighter-panel';
import { BattleLog } from '../../ui/battle-log/battle-log';

@Component({
  selector: 'app-battle-arena',
  imports: [BattleAnalysis, BattleFighterConfig, BattleFighterPanel, BattleLog],
  templateUrl: './battle-arena.html',
  styleUrl: './battle-arena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleArena {
  private readonly store = inject(BattleStore);

  protected readonly battle = this.store.battle;
  protected readonly weather = this.store.weather;
  protected readonly weatherOptions = this.store.weatherOptions;
  protected readonly seed = this.store.seed;
  protected readonly validationError = this.store.validationError;
  protected readonly canStart = this.store.canStart;
  protected readonly isBattleOver = this.store.isBattleOver;
  protected readonly currentWeather = computed(() => getBattleWeather(this.weather()));

  constructor() {
    this.store.initialize();
  }

  protected startBattle(): void {
    this.store.startBattle();
  }

  protected nextTurn(): void {
    this.store.nextTurn();
  }

  protected simulateFullBattle(): void {
    this.store.simulateFullBattle();
  }

  protected resetBattle(): void {
    this.store.resetBattle();
  }

  protected onWeatherChange(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }

    const value = event.target.value;
    const weather = this.weatherOptions.find((option) => option.id === value);

    if (weather) {
      this.store.setWeather(weather.id);
    }
  }

  protected onSeedChange(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.store.setSeed(Number(event.target.value));
    }
  }
}
