import { inject, Injectable, signal } from '@angular/core';
import { Move, Pokemon, PokemonIndexEntry, PokemonType, PokemonTypeName } from '../models';
import { LocalDbAdapter } from './local-db.adapter';
import { DexieLocalDb } from './local-db.dexie';
import { MemoryLocalDb } from './local-db.memory';
import { APP_DATABASE } from './local-db.provider';
import { SpriteRecord, TeamRecord, TrainerRecord } from './local-db.records';

export type LocalDbStatus = 'initializing' | 'indexeddb' | 'memory';

@Injectable({
  providedIn: 'root',
})
export class LocalDb {
  private readonly database = inject(APP_DATABASE);
  private readonly memory = new MemoryLocalDb();
  private readonly _status = signal<LocalDbStatus>('initializing');
  private readyPromise: Promise<LocalDbAdapter> | null = null;

  readonly status = this._status.asReadonly();

  ensureReady(): Promise<LocalDbAdapter> {
    this.readyPromise ??= this.initialize();

    return this.readyPromise;
  }

  async getMeta<T>(key: string): Promise<T | undefined> {
    return (await this.ensureReady()).getMeta<T>(key);
  }

  async setMeta<T>(key: string, value: T): Promise<void> {
    return (await this.ensureReady()).setMeta(key, value);
  }

  async getPokemonIndex(): Promise<readonly PokemonIndexEntry[]> {
    return (await this.ensureReady()).getPokemonIndex();
  }

  async putPokemonIndex(entry: PokemonIndexEntry): Promise<void> {
    return (await this.ensureReady()).putPokemonIndex(entry);
  }

  async bulkPutPokemonIndex(entries: readonly PokemonIndexEntry[]): Promise<void> {
    return (await this.ensureReady()).bulkPutPokemonIndex(entries);
  }

  async getPokemon(id: number): Promise<Pokemon | undefined> {
    return (await this.ensureReady()).getPokemon(id);
  }

  async getPokemonByName(name: string): Promise<Pokemon | undefined> {
    return (await this.ensureReady()).getPokemonByName(name);
  }

  async putPokemon(pokemon: Pokemon): Promise<void> {
    return (await this.ensureReady()).putPokemon(pokemon);
  }

  async getMove(name: string): Promise<Move | undefined> {
    return (await this.ensureReady()).getMove(name);
  }

  async putMove(move: Move): Promise<void> {
    return (await this.ensureReady()).putMove(move);
  }

  async bulkPutMoves(moves: readonly Move[]): Promise<void> {
    return (await this.ensureReady()).bulkPutMoves(moves);
  }

  async getType(name: PokemonTypeName): Promise<PokemonType | undefined> {
    return (await this.ensureReady()).getType(name);
  }

  async putType(type: PokemonType): Promise<void> {
    return (await this.ensureReady()).putType(type);
  }

  async bulkPutTypes(types: readonly PokemonType[]): Promise<void> {
    return (await this.ensureReady()).bulkPutTypes(types);
  }

  async getSprite(pokemonId: number): Promise<SpriteRecord | undefined> {
    return (await this.ensureReady()).getSprite(pokemonId);
  }

  async putSprite(sprite: SpriteRecord): Promise<void> {
    return (await this.ensureReady()).putSprite(sprite);
  }

  async getTeam(id: string): Promise<TeamRecord | undefined> {
    return (await this.ensureReady()).getTeam(id);
  }

  async putTeam(team: TeamRecord): Promise<void> {
    return (await this.ensureReady()).putTeam(team);
  }

  async deleteTeam(id: string): Promise<void> {
    return (await this.ensureReady()).deleteTeam(id);
  }

  async getTrainer(id: string): Promise<TrainerRecord | undefined> {
    return (await this.ensureReady()).getTrainer(id);
  }

  async putTrainer(trainer: TrainerRecord): Promise<void> {
    return (await this.ensureReady()).putTrainer(trainer);
  }

  async clearCache(): Promise<void> {
    return (await this.ensureReady()).clearCache();
  }

  private async initialize(): Promise<LocalDbAdapter> {
    if (typeof indexedDB === 'undefined') {
      return this.useMemory();
    }

    try {
      const adapter = new DexieLocalDb(this.database);
      await adapter.open();
      this._status.set('indexeddb');

      return adapter;
    } catch {
      return this.useMemory();
    }
  }

  private useMemory(): LocalDbAdapter {
    this._status.set('memory');

    return this.memory;
  }
}
