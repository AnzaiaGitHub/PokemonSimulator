import { Move, Pokemon, PokemonIndexEntry, PokemonType, PokemonTypeName } from '../models';
import { LocalDbAdapter } from './local-db.adapter';
import { SpriteRecord, TeamRecord, TrainerRecord } from './local-db.records';

export class MemoryLocalDb implements LocalDbAdapter {
  private readonly meta = new Map<string, unknown>();
  private readonly pokemonIndex = new Map<string, PokemonIndexEntry>();
  private readonly pokemon = new Map<number, Pokemon>();
  private readonly moves = new Map<string, Move>();
  private readonly types = new Map<PokemonTypeName, PokemonType>();
  private readonly sprites = new Map<number, SpriteRecord>();
  private readonly teams = new Map<string, TeamRecord>();
  private readonly trainers = new Map<string, TrainerRecord>();

  open(): Promise<void> {
    return Promise.resolve();
  }

  close(): void {
    return;
  }

  getMeta<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.meta.get(key) as T | undefined);
  }

  setMeta<T>(key: string, value: T): Promise<void> {
    this.meta.set(key, value);

    return Promise.resolve();
  }

  getPokemonIndex(): Promise<readonly PokemonIndexEntry[]> {
    return Promise.resolve([...this.pokemonIndex.values()]);
  }

  putPokemonIndex(entry: PokemonIndexEntry): Promise<void> {
    this.pokemonIndex.set(entry.name, entry);

    return Promise.resolve();
  }

  bulkPutPokemonIndex(entries: readonly PokemonIndexEntry[]): Promise<void> {
    for (const entry of entries) {
      this.pokemonIndex.set(entry.name, entry);
    }

    return Promise.resolve();
  }

  getPokemon(id: number): Promise<Pokemon | undefined> {
    return Promise.resolve(this.pokemon.get(id));
  }

  getPokemonByName(name: string): Promise<Pokemon | undefined> {
    return Promise.resolve([...this.pokemon.values()].find((entry) => entry.name === name));
  }

  putPokemon(pokemon: Pokemon): Promise<void> {
    this.pokemon.set(pokemon.id, pokemon);

    return Promise.resolve();
  }

  getMove(name: string): Promise<Move | undefined> {
    return Promise.resolve(this.moves.get(name));
  }

  putMove(move: Move): Promise<void> {
    this.moves.set(move.name, move);

    return Promise.resolve();
  }

  bulkPutMoves(moves: readonly Move[]): Promise<void> {
    for (const move of moves) {
      this.moves.set(move.name, move);
    }

    return Promise.resolve();
  }

  getType(name: PokemonTypeName): Promise<PokemonType | undefined> {
    return Promise.resolve(this.types.get(name));
  }

  putType(type: PokemonType): Promise<void> {
    this.types.set(type.name, type);

    return Promise.resolve();
  }

  bulkPutTypes(types: readonly PokemonType[]): Promise<void> {
    for (const type of types) {
      this.types.set(type.name, type);
    }

    return Promise.resolve();
  }

  getSprite(pokemonId: number): Promise<SpriteRecord | undefined> {
    return Promise.resolve(this.sprites.get(pokemonId));
  }

  putSprite(sprite: SpriteRecord): Promise<void> {
    this.sprites.set(sprite.pokemonId, sprite);

    return Promise.resolve();
  }

  getTeam(id: string): Promise<TeamRecord | undefined> {
    return Promise.resolve(this.teams.get(id));
  }

  putTeam(team: TeamRecord): Promise<void> {
    this.teams.set(team.id, team);

    return Promise.resolve();
  }

  deleteTeam(id: string): Promise<void> {
    this.teams.delete(id);

    return Promise.resolve();
  }

  getTrainer(id: string): Promise<TrainerRecord | undefined> {
    return Promise.resolve(this.trainers.get(id));
  }

  putTrainer(trainer: TrainerRecord): Promise<void> {
    this.trainers.set(trainer.id, trainer);

    return Promise.resolve();
  }

  clearCache(): Promise<void> {
    this.meta.clear();
    this.pokemonIndex.clear();
    this.pokemon.clear();
    this.moves.clear();
    this.types.clear();
    this.sprites.clear();

    return Promise.resolve();
  }
}
