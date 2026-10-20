import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { Move, Pokemon, PokemonType } from '../models';
import { LocalDb } from './local-db';
import { APP_DATABASE, LOCAL_DB_NAME } from './local-db.provider';
import { AppDatabase, DB_VERSION, SCHEMA_V1 } from './local-db.schema';
import { TeamRecord, TrainerRecord } from './local-db.records';

const POKEMON: Pokemon = {
  id: 25,
  name: 'pikachu',
  heightInMeters: 0.4,
  weightInKilograms: 6,
  types: ['electric'],
  stats: {
    hp: 35,
    attack: 55,
    defense: 40,
    specialAttack: 50,
    specialDefense: 50,
    speed: 90,
  },
  learnset: ['thunder-shock', 'quick-attack'],
  spriteUrl: null,
  fetchedAt: 1_700_000_000_000,
};

const MOVE: Move = {
  id: 85,
  name: 'thunderbolt',
  type: 'electric',
  damageClass: 'special',
  power: 90,
  accuracy: 100,
  pp: 15,
  priority: 0,
  fetchedAt: 1_700_000_000_000,
};

const TYPE: PokemonType = {
  name: 'electric',
  damageRelations: {
    noDamageFrom: [],
    halfDamageFrom: ['electric', 'flying'],
    doubleDamageFrom: ['ground'],
    noDamageTo: ['ground'],
    halfDamageTo: ['electric', 'grass', 'dragon'],
    doubleDamageTo: ['water', 'flying'],
  },
  pokemon: ['pikachu'],
};

const TEAM: TeamRecord = {
  id: 'team-1',
  trainerId: 'me',
  name: 'Main team',
  slots: [null, null, null, null, null, null],
  updatedAt: 1_700_000_000_000,
};

const TRAINER: TrainerRecord = {
  id: 'me',
  name: 'Me',
  avatarUrl: null,
  updatedAt: 1_700_000_000_000,
};

let database: AppDatabase | null = null;
let dbCounter = 0;

function setup(): { localDb: LocalDb; database: AppDatabase } {
  const name = `pokemon-simulator-test-${++dbCounter}`;

  TestBed.configureTestingModule({
    providers: [{ provide: LOCAL_DB_NAME, useValue: name }],
  });

  const localDb = TestBed.inject(LocalDb);
  const db = TestBed.inject(APP_DATABASE);
  database = db;

  return { localDb, database: db };
}

describe('LocalDb', () => {
  afterEach(async () => {
    vi.unstubAllGlobals();

    if (database) {
      database.close();
      await database.delete().catch(() => undefined);
      database = null;
    }
  });

  it('creates the versioned schema with the expected stores and indexes', () => {
    const { database: db } = setup();

    expect(db.tables.map((table) => table.name).sort()).toEqual([
      'meta',
      'moves',
      'pokemon',
      'pokemonIndex',
      'sprites',
      'teams',
      'trainers',
      'types',
    ]);

    const pokemon = db.table('pokemon');
    expect(pokemon.schema.primKey.name).toBe('id');
    expect(pokemon.schema.indexes.map((index) => index.name).sort()).toEqual(['fetchedAt', 'name']);

    const moves = db.table('moves');
    expect(moves.schema.primKey.name).toBe('name');
    expect(moves.schema.indexes.map((index) => index.name).sort()).toEqual([
      'damageClass',
      'fetchedAt',
      'type',
    ]);

    expect(db.table('pokemonIndex').schema.primKey.name).toBe('name');
    expect(
      db
        .table('teams')
        .schema.indexes.map((index) => index.name)
        .sort(),
    ).toEqual(['name', 'trainerId']);
    expect(db.table('trainers').schema.indexes.map((index) => index.name)).toEqual(['name']);
  });

  it('uses IndexedDB when available', async () => {
    const { localDb } = setup();

    await localDb.ensureReady();

    expect(localDb.status()).toBe('indexeddb');
  });

  it('stores and reads every entity through the typed API', async () => {
    const { localDb } = setup();

    await localDb.setMeta('schemaVersion', 1);
    await localDb.bulkPutPokemonIndex([{ id: POKEMON.id, name: POKEMON.name }]);
    await localDb.putPokemon(POKEMON);
    await localDb.putMove(MOVE);
    await localDb.putType(TYPE);
    await localDb.putSprite({ pokemonId: POKEMON.id, blob: new Blob(['sprite']), fetchedAt: 1 });
    await localDb.putTeam(TEAM);
    await localDb.putTrainer(TRAINER);

    expect(await localDb.getMeta<number>('schemaVersion')).toBe(1);
    expect(await localDb.getPokemonIndex()).toEqual([{ id: POKEMON.id, name: POKEMON.name }]);
    expect(await localDb.getPokemon(POKEMON.id)).toEqual(POKEMON);
    expect(await localDb.getPokemonByName(POKEMON.name)).toEqual(POKEMON);
    expect(await localDb.getMove(MOVE.name)).toEqual(MOVE);
    expect(await localDb.getType(TYPE.name)).toEqual(TYPE);
    expect(await localDb.getSprite(POKEMON.id)).toBeDefined();
    expect(await localDb.getTeam(TEAM.id)).toEqual(TEAM);
    expect(await localDb.getTrainer(TRAINER.id)).toEqual(TRAINER);
  });

  it('clears the cache but keeps teams and trainers', async () => {
    const { localDb } = setup();

    await localDb.putPokemon(POKEMON);
    await localDb.setMeta('schemaVersion', 1);
    await localDb.putTeam(TEAM);
    await localDb.putTrainer(TRAINER);

    await localDb.clearCache();

    expect(await localDb.getPokemon(POKEMON.id)).toBeUndefined();
    expect(await localDb.getMeta('schemaVersion')).toBeUndefined();
    expect(await localDb.getTeam(TEAM.id)).toEqual(TEAM);
    expect(await localDb.getTrainer(TRAINER.id)).toEqual(TRAINER);
  });

  it('keeps data after reopening the database', async () => {
    const { localDb, database: db } = setup();

    await localDb.putTeam(TEAM);
    db.close();
    await db.open();

    expect(await localDb.getTeam(TEAM.id)).toEqual(TEAM);
  });

  it('upgrades the schema without deleting teams', async () => {
    const name = `pokemon-simulator-upgrade-test-${++dbCounter}`;
    const legacy = new Dexie(name);

    legacy.version(1).stores(SCHEMA_V1);
    await legacy.open();
    await legacy.table('teams').put(TEAM);
    legacy.close();

    TestBed.configureTestingModule({
      providers: [{ provide: LOCAL_DB_NAME, useValue: name }],
    });

    const localDb = TestBed.inject(LocalDb);
    database = TestBed.inject(APP_DATABASE);

    expect(await localDb.getTeam(TEAM.id)).toEqual(TEAM);
    expect(await localDb.getMeta<number>('schemaVersion')).toBe(DB_VERSION);
  });

  it('falls back to memory when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const { localDb } = setup();

    await localDb.ensureReady();

    expect(localDb.status()).toBe('memory');
    await localDb.putPokemon(POKEMON);
    expect(await localDb.getPokemon(POKEMON.id)).toEqual(POKEMON);
  });
});
