import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { LocalDb } from '../../../core/database';
import { TeamRecord } from '../../../core/database/local-db.records';
import { Move, Pokemon, TeamSlot } from '../../../core/models';
import { MAX_MOVES_PER_POKEMON } from '../utils/move-selection';

export const TEAM_SIZE = 6;
export const DEFAULT_TEAM_ID = 'default';
export const DEFAULT_TEAM_NAME = 'My Team';
export const DEFAULT_TRAINER_ID = 'me';
export const ALLOW_DUPLICATE_POKEMON = false;

export type TeamSlots = readonly (TeamSlot | null)[];

export function createEmptyTeamSlots(size: number = TEAM_SIZE): TeamSlots {
  return Array.from({ length: size }, () => null);
}

export type AddPokemonResult =
  | { ok: true; index: number }
  | { ok: false; reason: 'full' | 'duplicate' | 'invalid'; message: string };

export type SetMovesResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'invalid' | 'too-many' | 'duplicate';
      message: string;
    };

export function capitalizeName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

@Injectable({
  providedIn: 'root',
})
export class TeamStore {
  private readonly localDb = inject(LocalDb);
  private readonly _slots = signal<TeamSlots>(createEmptyTeamSlots());
  private readonly _status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  private readonly _error = signal<string | null>(null);
  private loadPromise: Promise<void> | null = null;

  readonly slots = this._slots.asReadonly();
  readonly teamSize = TEAM_SIZE;
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();

  readonly occupiedCount = computed(() => this._slots().filter((slot) => slot !== null).length);
  readonly freeSlotCount = computed(() => this.teamSize - this.occupiedCount());
  readonly isFull = computed(() => this.occupiedCount() === this.teamSize);
  readonly firstFreeSlotIndex = computed(() => this._slots().findIndex((slot) => slot === null));
  readonly isReady = computed(() => this._status() === 'ready' || this._status() === 'error');

  constructor() {
    effect(() => {
      if (this._status() === 'ready') {
        this.persist();
      }
    });
  }

  hasPokemon(name: string): boolean {
    const lowerName = name.toLowerCase();
    return this._slots().some((slot) => slot?.pokemon.name.toLowerCase() === lowerName);
  }

  addPokemon(pokemon: Pokemon): AddPokemonResult {
    if (!this.isReady()) {
      return { ok: false, reason: 'invalid', message: 'Team not ready yet' };
    }
    if (this.isFull()) {
      return { ok: false, reason: 'full', message: 'Team is full (6/6)' };
    }
    if (!ALLOW_DUPLICATE_POKEMON && this.hasPokemon(pokemon.name)) {
      return {
        ok: false,
        reason: 'duplicate',
        message: `${capitalizeName(pokemon.name)} is already in the team`,
      };
    }

    const index = this.firstFreeSlotIndex();
    if (index === -1) {
      return { ok: false, reason: 'full', message: 'Team is full (6/6)' };
    }

    const slot: TeamSlot = { pokemon, moves: [] };
    this.setSlot(index, slot);

    return { ok: true, index };
  }

  removePokemon(index: number): boolean {
    if (!this.isValidIndex(index)) {
      return false;
    }
    this.removeSlot(index);
    return true;
  }

  setSlot(index: number, slot: TeamSlot | null): boolean {
    if (!this.isValidIndex(index)) {
      return false;
    }

    this._slots.update((slots) => slots.map((current, i) => (i === index ? slot : current)));

    return true;
  }

  removeSlot(index: number): boolean {
    return this.setSlot(index, null);
  }

  setMoves(index: number, moves: readonly Move[]): SetMovesResult {
    if (!this.isValidIndex(index)) {
      return { ok: false, reason: 'invalid', message: 'Invalid team slot' };
    }

    const slot = this._slots()[index];

    if (!slot) {
      return { ok: false, reason: 'invalid', message: 'This slot is empty' };
    }

    if (moves.length > MAX_MOVES_PER_POKEMON) {
      return {
        ok: false,
        reason: 'too-many',
        message: `A Pokémon can know at most ${MAX_MOVES_PER_POKEMON} moves`,
      };
    }

    const names = moves.map((move) => move.name.trim().toLowerCase());

    if (new Set(names).size !== names.length) {
      return {
        ok: false,
        reason: 'duplicate',
        message: 'A Pokémon cannot know the same move twice',
      };
    }

    this.setSlot(index, { ...slot, moves: [...moves] });

    return { ok: true };
  }

  swapSlots(from: number, to: number): boolean {
    if (!this.isValidIndex(from) || !this.isValidIndex(to) || from === to) {
      return false;
    }

    this._slots.update((slots) => {
      const next = [...slots];
      const fromSlot = next[from] ?? null;
      const toSlot = next[to] ?? null;
      next[from] = toSlot;
      next[to] = fromSlot;

      return next;
    });

    return true;
  }

  clear(): void {
    this._slots.set(createEmptyTeamSlots(this.teamSize));
  }

  async load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this._status.set('loading');
    this._error.set(null);

    this.loadPromise = (async () => {
      try {
        const record = await this.localDb.getTeam(DEFAULT_TEAM_ID);
        if (record && record.slots.length === TEAM_SIZE) {
          this._slots.set(record.slots);
        }
        this._status.set('ready');
      } catch (err) {
        this._status.set('error');
        this._error.set(err instanceof Error ? err.message : 'Failed to load team');
      }
    })();

    return this.loadPromise;
  }

  private async persist(): Promise<void> {
    if (this._status() !== 'ready') return;

    const record: TeamRecord = {
      id: DEFAULT_TEAM_ID,
      trainerId: DEFAULT_TRAINER_ID,
      name: DEFAULT_TEAM_NAME,
      slots: this._slots(),
      updatedAt: Date.now(),
    };

    try {
      await this.localDb.putTeam(record);
    } catch {
      // Persistence failure is non-blocking
    }
  }

  private isValidIndex(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < this.teamSize;
  }
}
