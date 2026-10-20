import Dexie, { type Table } from 'dexie';
import { Move, Pokemon, PokemonIndexEntry, PokemonType, PokemonTypeName } from '../models';
import { MetaRecord, SpriteRecord, TeamRecord, TrainerRecord } from './local-db.records';

export const DEFAULT_LOCAL_DB_NAME = 'pokemon-simulator';
export const DB_VERSION = 1;

export class AppDatabase extends Dexie {
  meta!: Table<MetaRecord, string>;
  pokemonIndex!: Table<PokemonIndexEntry, string>;
  pokemon!: Table<Pokemon, number>;
  moves!: Table<Move, string>;
  types!: Table<PokemonType, PokemonTypeName>;
  sprites!: Table<SpriteRecord, number>;
  teams!: Table<TeamRecord, string>;
  trainers!: Table<TrainerRecord, string>;

  constructor(name: string = DEFAULT_LOCAL_DB_NAME) {
    super(name);

    this.version(DB_VERSION).stores({
      meta: 'key',
      pokemonIndex: 'name, id',
      pokemon: 'id, name, fetchedAt',
      moves: 'name, type, damageClass, fetchedAt',
      types: 'name',
      sprites: 'pokemonId',
      teams: 'id, trainerId',
      trainers: 'id',
    });
  }
}
