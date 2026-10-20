import { Move, Pokemon } from '../../../core/models';

export type BattleFighterSource = 'team' | 'pokedex';

export type BattleConfigStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface BattleMoveProgress {
  readonly loaded: number;
  readonly failed: number;
  readonly total: number;
}

export interface BattleFighterConfig {
  readonly source: BattleFighterSource;
  readonly teamSlotIndex: number | null;
  readonly pokemon: Pokemon | null;
  readonly moves: readonly Move[];
  readonly availableMoves: readonly Move[];
  readonly status: BattleConfigStatus;
  readonly error: string | null;
  readonly progress: BattleMoveProgress;
}

export interface AnalysisOptions {
  readonly battles?: number;
  readonly seed?: number;
}

export function createEmptyFighter(source: BattleFighterSource = 'team'): BattleFighterConfig {
  return {
    source,
    teamSlotIndex: null,
    pokemon: null,
    moves: [],
    availableMoves: [],
    status: 'idle',
    error: null,
    progress: { loaded: 0, failed: 0, total: 0 },
  };
}
