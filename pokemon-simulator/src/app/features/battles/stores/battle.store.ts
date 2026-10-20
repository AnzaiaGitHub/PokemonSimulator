import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Move } from '../../../core/models';
import { POKEDEX_REPOSITORY } from '../../pokedex/data-access/pokedex.repository';
import { PokemonTypeCache } from '../../pokedex/data-access/pokemon-type-cache';
import { PokedexStore } from '../../pokedex/stores/pokedex.store';
import { MoveCatalog } from '../../team/data-access/move-catalog';
import { TeamStore } from '../../team/stores/team.store';
import { BattleAnalysisService } from '../data-access/battle-analysis.service';
import {
  BattleSetup,
  BattleSide,
  BattleState,
  BATTLE_WEATHERS,
  buildMatchup,
  canFight,
  createBattleFighter,
  createBattleState,
  createSeededRng,
  MAX_BATTLE_MOVES,
  MAX_BATTLE_TURNS,
  MatchupEntry,
  pickBattleMoves,
  resolveTurn,
  SeededRng,
  simulateBattle,
  toggleBattleMove,
  BattleWeather,
} from '../engine';
import {
  BattleFighterConfig,
  BattleFighterSource,
  createEmptyFighter,
} from '../models/battle-ui.model';

export const DEFAULT_BATTLE_SEED = 1;
export const BATTLE_ANALYSIS_BATTLES = 100;

@Injectable({
  providedIn: 'root',
})
export class BattleStore {
  private readonly repository = inject(POKEDEX_REPOSITORY);
  private readonly pokedexStore = inject(PokedexStore);
  private readonly typeCache = inject(PokemonTypeCache);
  private readonly teamStore = inject(TeamStore);
  private readonly moveCatalog = inject(MoveCatalog);
  private readonly analysis = inject(BattleAnalysisService);

  private readonly _player = signal<BattleFighterConfig>(createEmptyFighter());
  private readonly _opponent = signal<BattleFighterConfig>(createEmptyFighter());
  private readonly _weather = signal<BattleWeather>('clear');
  private readonly _seed = signal(DEFAULT_BATTLE_SEED);
  private readonly _battle = signal<BattleState | null>(null);
  private readonly selectionTokens: Record<BattleSide, number> = { player: 0, opponent: 0 };

  private rng: SeededRng | null = null;
  private initialized = false;

  readonly player = this._player.asReadonly();
  readonly opponent = this._opponent.asReadonly();
  readonly weather = this._weather.asReadonly();
  readonly seed = this._seed.asReadonly();
  readonly battle = this._battle.asReadonly();
  readonly weatherOptions = BATTLE_WEATHERS;
  readonly maxMoves = MAX_BATTLE_MOVES;
  readonly analysisBattles = BATTLE_ANALYSIS_BATTLES;

  readonly teamSlots = this.teamStore.slots;
  readonly teamStatus = this.teamStore.status;
  readonly teamError = this.teamStore.error;
  readonly pokedexIndex = this.pokedexStore.index;
  readonly pokedexStatus = this.pokedexStore.status;
  readonly pokedexError = this.pokedexStore.error;
  readonly typeChart = this.typeCache.types;
  readonly typeStatus = this.typeCache.status;

  readonly analysisStatus = this.analysis.status;
  readonly analysisCompleted = this.analysis.completed;
  readonly analysisTotal = this.analysis.total;
  readonly analysisPercent = this.analysis.percent;
  readonly analysisResult = this.analysis.result;
  readonly analysisError = this.analysis.error;

  readonly setup = computed<BattleSetup | null>(() => {
    const player = this._player();
    const opponent = this._opponent();

    if (
      !player.pokemon ||
      !opponent.pokemon ||
      !canFight(player.moves) ||
      !canFight(opponent.moves)
    ) {
      return null;
    }

    return {
      player: { pokemon: player.pokemon, moves: player.moves },
      opponent: { pokemon: opponent.pokemon, moves: opponent.moves },
      weather: this._weather(),
    };
  });

  readonly validationError = computed<string | null>(() => {
    if (this.typeStatus() === 'idle' || this.typeStatus() === 'loading') {
      return 'Loading type data…';
    }

    if (this.typeChart().size === 0) {
      return 'Type data is unavailable. Connect to the internet and try again.';
    }

    const player = this._player();
    const opponent = this._opponent();

    return validateFighter(player, 'Player 1') ?? validateFighter(opponent, 'Player 2') ?? null;
  });

  readonly canStart = computed(() => this.validationError() === null);
  readonly isBattleOver = computed(() => {
    const battle = this._battle();

    return battle !== null && (battle.winner !== null || battle.turn > MAX_BATTLE_TURNS);
  });
  readonly currentTurn = computed(() => this._battle()?.turn ?? 0);
  readonly log = computed(() => this._battle()?.log ?? []);

  readonly playerMatchup = computed<readonly MatchupEntry[]>(() => {
    const setup = this.setup();
    const typeChart = this.typeChart();

    if (!setup || typeChart.size === 0) {
      return [];
    }

    return buildMatchup(
      createBattleFighter(setup.player),
      createBattleFighter(setup.opponent),
      setup.weather,
      typeChart,
    );
  });

  readonly opponentMatchup = computed<readonly MatchupEntry[]>(() => {
    const setup = this.setup();
    const typeChart = this.typeChart();

    if (!setup || typeChart.size === 0) {
      return [];
    }

    return buildMatchup(
      createBattleFighter(setup.opponent),
      createBattleFighter(setup.player),
      setup.weather,
      typeChart,
    );
  });

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    void this.teamStore.load();
    this.pokedexStore.load();
    void this.typeCache.loadAll();
  }

  setSource(side: BattleSide, source: BattleFighterSource): void {
    this.selectionTokens[side] += 1;
    this.resetBattle();
    this.analysis.reset();
    this.updateConfig(side, () => createEmptyFighter(source));
  }

  selectTeamSlot(side: BattleSide, index: number): void {
    const slot = this.teamStore.slots()[index];

    this.selectionTokens[side] += 1;
    this.resetBattle();
    this.analysis.reset();

    if (!slot) {
      this.updateConfig(side, () => createEmptyFighter('team'));
      return;
    }

    this.updateConfig(side, () => ({
      source: 'team',
      teamSlotIndex: index,
      pokemon: slot.pokemon,
      moves: slot.moves,
      availableMoves: slot.moves,
      status: 'ready',
      error: null,
      progress: { loaded: slot.moves.length, failed: 0, total: slot.moves.length },
    }));
  }

  async selectPokedexPokemon(side: BattleSide, nameOrId: string | number): Promise<void> {
    const token = ++this.selectionTokens[side];

    this.resetBattle();
    this.analysis.reset();
    this.updateConfig(side, () => ({
      ...createEmptyFighter('pokedex'),
      status: 'loading',
    }));

    try {
      const { data: pokemon } = await firstValueFrom(this.repository.getPokemon(nameOrId));

      if (token !== this.selectionTokens[side]) {
        return;
      }

      this.updateConfig(side, (config) => ({
        ...config,
        pokemon,
        status: 'loading',
        progress: { loaded: 0, failed: 0, total: pokemon.learnset.length },
      }));

      const result = await this.moveCatalog.loadMoves(pokemon.learnset, (progress) => {
        if (token !== this.selectionTokens[side]) {
          return;
        }

        this.updateConfig(side, (config) => ({ ...config, progress }));
      });

      if (token !== this.selectionTokens[side]) {
        return;
      }

      const defaultMoves = pickBattleMoves(result.moves);

      this.updateConfig(side, (config) => ({
        ...config,
        moves: defaultMoves,
        availableMoves: result.moves,
        status: defaultMoves.length > 0 ? 'ready' : 'error',
        error:
          defaultMoves.length > 0
            ? null
            : result.failed.length > 0
              ? "Could not load this Pokémon's moves. Check your connection and try again."
              : 'This Pokémon has no attack moves. Choose another one.',
      }));
    } catch {
      if (token !== this.selectionTokens[side]) {
        return;
      }

      this.updateConfig(side, (config) => ({
        ...config,
        status: 'error',
        error: 'Could not load this Pokémon. Check your connection and try again.',
      }));
    }
  }

  toggleMove(side: BattleSide, move: Move): void {
    const config = this.config(side)();

    if (config.status !== 'ready' || config.source !== 'pokedex') {
      return;
    }

    const moves = toggleBattleMove(config.moves, move, MAX_BATTLE_MOVES);

    this.updateConfig(side, (current) => ({ ...current, moves }));
    this.resetBattle();
    this.analysis.reset();
  }

  setWeather(weather: BattleWeather): void {
    this._weather.set(weather);
    this.resetBattle();
    this.analysis.reset();
  }

  setSeed(seed: number): void {
    if (!Number.isFinite(seed)) {
      return;
    }

    this._seed.set(Math.max(0, Math.trunc(seed)));
    this.resetBattle();
    this.analysis.reset();
  }

  startBattle(): boolean {
    const setup = this.setup();

    if (!setup || !this.canStart()) {
      return false;
    }

    this.analysis.reset();
    this.rng = createSeededRng(this._seed());
    this._battle.set(createBattleState(setup, this.typeChart()));

    return true;
  }

  nextTurn(): void {
    const battle = this._battle();

    if (!battle || battle.winner !== null || battle.turn > MAX_BATTLE_TURNS || !this.rng) {
      return;
    }

    this._battle.set(resolveTurn(battle, this.rng));
  }

  simulateFullBattle(): void {
    const battle = this._battle();

    if (!battle || battle.winner !== null || !this.rng) {
      return;
    }

    this._battle.set(simulateBattle(battle, this.rng));
  }

  resetBattle(): void {
    this._battle.set(null);
    this.rng = null;
  }

  analyze(): void {
    const setup = this.setup();

    if (!setup || !this.canStart()) {
      return;
    }

    void this.analysis.run(setup, this.typeChart(), {
      battles: BATTLE_ANALYSIS_BATTLES,
      seed: this._seed(),
    });
  }

  cancelAnalysis(): void {
    this.analysis.cancel();
  }

  resetAnalysis(): void {
    this.analysis.reset();
  }

  isMoveSelected(side: BattleSide, move: Move): boolean {
    return this.config(side)().moves.some((selected) => selected.name === move.name);
  }

  private config(side: BattleSide): WritableSignal<BattleFighterConfig> {
    return side === 'player' ? this._player : this._opponent;
  }

  private updateConfig(
    side: BattleSide,
    updater: (config: BattleFighterConfig) => BattleFighterConfig,
  ): void {
    this.config(side).update(updater);
  }
}

function validateFighter(config: BattleFighterConfig, label: string): string | null {
  if (config.status === 'loading') {
    return `Loading ${label} moves…`;
  }

  if (config.status === 'error') {
    return config.error ?? `Could not load ${label}.`;
  }

  if (!config.pokemon) {
    return `Choose a Pokémon for ${label}.`;
  }

  if (!canFight(config.moves)) {
    return `${label} needs at least one attack move.`;
  }

  return null;
}
