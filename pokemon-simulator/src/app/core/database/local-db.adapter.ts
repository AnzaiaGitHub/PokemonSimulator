import { Move, Pokemon, PokemonIndexEntry, PokemonType, PokemonTypeName } from '../models';
import { SpriteRecord, TeamRecord, TrainerRecord } from './local-db.records';

export interface LocalDbAdapter {
  open(): Promise<void>;
  close(): void;
  getMeta<T>(key: string): Promise<T | undefined>;
  setMeta<T>(key: string, value: T): Promise<void>;
  getPokemonIndex(): Promise<readonly PokemonIndexEntry[]>;
  putPokemonIndex(entry: PokemonIndexEntry): Promise<void>;
  bulkPutPokemonIndex(entries: readonly PokemonIndexEntry[]): Promise<void>;
  getPokemon(id: number): Promise<Pokemon | undefined>;
  getPokemonByName(name: string): Promise<Pokemon | undefined>;
  putPokemon(pokemon: Pokemon): Promise<void>;
  getMove(name: string): Promise<Move | undefined>;
  putMove(move: Move): Promise<void>;
  bulkPutMoves(moves: readonly Move[]): Promise<void>;
  getType(name: PokemonTypeName): Promise<PokemonType | undefined>;
  putType(type: PokemonType): Promise<void>;
  bulkPutTypes(types: readonly PokemonType[]): Promise<void>;
  getSprite(pokemonId: number): Promise<SpriteRecord | undefined>;
  putSprite(sprite: SpriteRecord): Promise<void>;
  getTeam(id: string): Promise<TeamRecord | undefined>;
  putTeam(team: TeamRecord): Promise<void>;
  deleteTeam(id: string): Promise<void>;
  getTrainer(id: string): Promise<TrainerRecord | undefined>;
  putTrainer(trainer: TrainerRecord): Promise<void>;
  clearCache(): Promise<void>;
}
