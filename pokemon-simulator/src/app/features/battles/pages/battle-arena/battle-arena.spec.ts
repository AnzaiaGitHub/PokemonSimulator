import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BATTLE_WEATHERS } from '../../engine';
import { createEmptyFighter } from '../../models/battle-ui.model';
import { BattleStore } from '../../stores/battle.store';
import { BattleArena } from './battle-arena';

function createBattleStoreMock() {
  return {
    battle: signal(null).asReadonly(),
    weather: signal<'clear' | 'sun' | 'rain'>('clear').asReadonly(),
    weatherOptions: BATTLE_WEATHERS,
    seed: signal(1).asReadonly(),
    validationError: signal<string | null>('Choose a Pokémon for Player 1.').asReadonly(),
    canStart: signal(false).asReadonly(),
    isBattleOver: signal(false).asReadonly(),
    teamSlots: signal([null, null, null, null, null, null]).asReadonly(),
    teamStatus: signal<'idle' | 'loading' | 'ready' | 'error'>('ready').asReadonly(),
    pokedexIndex: signal([]).asReadonly(),
    pokedexStatus: signal<'idle' | 'loading' | 'ready' | 'error'>('ready').asReadonly(),
    pokedexError: signal<string | null>(null).asReadonly(),
    maxMoves: 4,
    player: signal(createEmptyFighter()).asReadonly(),
    opponent: signal(createEmptyFighter()).asReadonly(),
    playerMatchup: signal([]).asReadonly(),
    opponentMatchup: signal([]).asReadonly(),
    analysisStatus: signal<'idle' | 'running' | 'done' | 'cancelled' | 'error'>(
      'idle',
    ).asReadonly(),
    analysisCompleted: signal(0).asReadonly(),
    analysisTotal: signal(0).asReadonly(),
    analysisPercent: signal(0).asReadonly(),
    analysisResult: signal(null).asReadonly(),
    analysisError: signal<string | null>(null).asReadonly(),
    analysisBattles: 100,
    initialize: vi.fn(),
    startBattle: vi.fn(),
    nextTurn: vi.fn(),
    simulateFullBattle: vi.fn(),
    resetBattle: vi.fn(),
    setWeather: vi.fn(),
    setSeed: vi.fn(),
    setSource: vi.fn(),
    selectTeamSlot: vi.fn(),
    selectPokedexPokemon: vi.fn(),
    toggleMove: vi.fn(),
    isMoveSelected: vi.fn(() => false),
    analyze: vi.fn(),
    cancelAnalysis: vi.fn(),
    resetAnalysis: vi.fn(),
  };
}

describe('BattleArena', () => {
  let fixture: ComponentFixture<BattleArena>;
  let store: ReturnType<typeof createBattleStoreMock>;

  beforeEach(async () => {
    store = createBattleStoreMock();

    await TestBed.configureTestingModule({
      imports: [BattleArena],
      providers: [provideRouter([]), { provide: BattleStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(BattleArena);
    fixture.detectChanges();
  });

  it('should create and initialize the store', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(store.initialize).toHaveBeenCalled();
  });

  it('renders both fighter setup panels', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('app-battle-fighter-config')).toHaveLength(2);
  });

  it('shows the validation message and disables the start button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const startButton = Array.from(compiled.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Start battle'),
    );

    expect(compiled.textContent).toContain('Choose a Pokémon for Player 1.');
    expect(startButton?.disabled).toBe(true);
  });
});
