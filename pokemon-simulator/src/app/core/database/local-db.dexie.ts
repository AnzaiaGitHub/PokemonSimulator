import { Move, Pokemon, PokemonIndexEntry, PokemonType, PokemonTypeName } from '../models';
import { LocalDbAdapter } from './local-db.adapter';
import { SpriteRecord, TeamRecord, TrainerRecord } from './local-db.records';
import { AppDatabase } from './local-db.schema';

export class DexieLocalDb implements LocalDbAdapter {
  constructor(private readonly db: AppDatabase) {}

  async open(): Promise<void> {
    await this.db.open();
  }

  close(): void {
    this.db.close();
  }

  async getMeta<T>(key: string): Promise<T | undefined> {
    const record = await this.db.meta.get(key);

    return record?.value as T | undefined;
  }

  async setMeta<T>(key: string, value: T): Promise<void> {
    await this.db.meta.put({ key, value, updatedAt: Date.now() });
  }

  getPokemonIndex(): Promise<PokemonIndexEntry[]> {
    return this.db.pokemonIndex.toArray();
  }

  async putPokemonIndex(entry: PokemonIndexEntry): Promise<void> {
    await this.db.pokemonIndex.put(entry);
  }

  async bulkPutPokemonIndex(entries: readonly PokemonIndexEntry[]): Promise<void> {
    await this.db.pokemonIndex.bulkPut(entries);
  }

  getPokemon(id: number): Promise<Pokemon | undefined> {
    return this.db.pokemon.get(id);
  }

  getPokemonByName(name: string): Promise<Pokemon | undefined> {
    return this.db.pokemon.where('name').equals(name).first();
  }

  async putPokemon(pokemon: Pokemon): Promise<void> {
    await this.db.pokemon.put(pokemon);
  }

  getMove(name: string): Promise<Move | undefined> {
    return this.db.moves.get(name);
  }

  async putMove(move: Move): Promise<void> {
    await this.db.moves.put(move);
  }

  async bulkPutMoves(moves: readonly Move[]): Promise<void> {
    await this.db.moves.bulkPut(moves);
  }

  getType(name: PokemonTypeName): Promise<PokemonType | undefined> {
    return this.db.types.get(name);
  }

  async putType(type: PokemonType): Promise<void> {
    await this.db.types.put(type);
  }

  async bulkPutTypes(types: readonly PokemonType[]): Promise<void> {
    await this.db.types.bulkPut(types);
  }

  getSprite(pokemonId: number): Promise<SpriteRecord | undefined> {
    return this.db.sprites.get(pokemonId);
  }

  async putSprite(sprite: SpriteRecord): Promise<void> {
    await this.db.sprites.put(sprite);
  }

  getTeam(id: string): Promise<TeamRecord | undefined> {
    return this.db.teams.get(id);
  }

  async putTeam(team: TeamRecord): Promise<void> {
    await this.db.teams.put(team);
  }

  async deleteTeam(id: string): Promise<void> {
    await this.db.teams.delete(id);
  }

  getTrainer(id: string): Promise<TrainerRecord | undefined> {
    return this.db.trainers.get(id);
  }

  async putTrainer(trainer: TrainerRecord): Promise<void> {
    await this.db.trainers.put(trainer);
  }

  async clearCache(): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.meta,
        this.db.pokemonIndex,
        this.db.pokemon,
        this.db.moves,
        this.db.types,
        this.db.sprites,
      ],
      async () => {
        await Promise.all([
          this.db.meta.clear(),
          this.db.pokemonIndex.clear(),
          this.db.pokemon.clear(),
          this.db.moves.clear(),
          this.db.types.clear(),
          this.db.sprites.clear(),
        ]);
      },
    );
  }
}
