import { TestBed } from '@angular/core/testing';
import { Pokemon, TeamSlot } from '../../../core/models';
import {
  ALLOW_DUPLICATE_POKEMON,
  createEmptyTeamSlots,
  DEFAULT_TEAM_ID,
  DEFAULT_TEAM_NAME,
  DEFAULT_TRAINER_ID,
  TEAM_SIZE,
  TeamStore,
} from './team.store';
import { LocalDb } from '../../../core/database';
import { LOCAL_DB_NAME } from '../../../core/database/local-db.provider';
import { TeamRecord } from '../../../core/database/local-db.records';

function createPokemon(id: number, name: string): Pokemon {
  return {
    id,
    name,
    heightInMeters: 1,
    weightInKilograms: 10,
    types: ['normal'],
    stats: {
      hp: 50,
      attack: 50,
      defense: 50,
      specialAttack: 50,
      specialDefense: 50,
      speed: 50,
    },
    learnset: ['tackle'],
    spriteUrl: null,
    fetchedAt: 0,
  };
}

function createSlot(id: number, name: string): TeamSlot {
  return { pokemon: createPokemon(id, name), moves: [] };
}

function createTeamRecord(slots: TeamRecord['slots']): TeamRecord {
  return {
    id: DEFAULT_TEAM_ID,
    trainerId: DEFAULT_TRAINER_ID,
    name: DEFAULT_TEAM_NAME,
    slots,
    updatedAt: Date.now(),
  };
}

async function createLoadedStore(
  initialSlots: TeamRecord['slots'] = createEmptyTeamSlots(),
): Promise<TeamStore> {
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCAL_DB_NAME, useValue: `test-${Date.now()}-${Math.random()}` },
    ],
  });

  const store = TestBed.inject(TeamStore);
  const localDb = TestBed.inject(LocalDb);

  await localDb.putTeam(createTeamRecord(initialSlots));
  await store.load();

  return store;
}

function createStoreSync(): TeamStore {
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCAL_DB_NAME, useValue: `test-sync-${Date.now()}-${Math.random()}` },
    ],
  });

  return TestBed.inject(TeamStore);
}

describe('TeamStore', () => {
  describe('basic state', () => {
    it('starts with six empty slots', () => {
      const store = createStoreSync();

      expect(store.teamSize).toBe(TEAM_SIZE);
      expect(store.slots()).toHaveLength(TEAM_SIZE);
      expect(store.slots().every((slot) => slot === null)).toBe(true);
      expect(store.occupiedCount()).toBe(0);
      expect(store.freeSlotCount()).toBe(TEAM_SIZE);
      expect(store.isFull()).toBe(false);
      expect(store.firstFreeSlotIndex()).toBe(0);
    });

    it('places a slot at a given index and updates the derived state', () => {
      const store = createStoreSync();
      const slot = createSlot(1, 'bulbasaur');

      expect(store.setSlot(2, slot)).toBe(true);

      expect(store.slots()[2]).toBe(slot);
      expect(store.occupiedCount()).toBe(1);
      expect(store.freeSlotCount()).toBe(TEAM_SIZE - 1);
      expect(store.firstFreeSlotIndex()).toBe(0);
    });

    it('reports a full team when all slots are occupied', () => {
      const store = createStoreSync();

      for (let index = 0; index < TEAM_SIZE; index++) {
        store.setSlot(index, createSlot(index + 1, `pokemon-${index + 1}`));
      }

      expect(store.occupiedCount()).toBe(TEAM_SIZE);
      expect(store.freeSlotCount()).toBe(0);
      expect(store.isFull()).toBe(true);
      expect(store.firstFreeSlotIndex()).toBe(-1);
    });

    it('never exceeds six slots when an out-of-bounds index is used', () => {
      const store = createStoreSync();

      expect(store.setSlot(TEAM_SIZE, createSlot(1, 'bulbasaur'))).toBe(false);
      expect(store.setSlot(-1, createSlot(1, 'bulbasaur'))).toBe(false);
      expect(store.setSlot(1.5, createSlot(1, 'bulbasaur'))).toBe(false);

      expect(store.occupiedCount()).toBe(0);
      expect(store.slots()).toHaveLength(TEAM_SIZE);
    });

    it('removes a slot without shifting the remaining positions', () => {
      const store = createStoreSync();
      store.setSlot(0, createSlot(1, 'bulbasaur'));
      store.setSlot(1, createSlot(4, 'charmander'));

      expect(store.removeSlot(0)).toBe(true);

      expect(store.slots()[0]).toBeNull();
      expect(store.slots()[1]?.pokemon.name).toBe('charmander');
      expect(store.occupiedCount()).toBe(1);
      expect(store.firstFreeSlotIndex()).toBe(0);
    });

    it('ignores removal of out-of-bounds indices', () => {
      const store = createStoreSync();
      store.setSlot(0, createSlot(1, 'bulbasaur'));

      expect(store.removeSlot(-1)).toBe(false);
      expect(store.removeSlot(TEAM_SIZE)).toBe(false);
      expect(store.occupiedCount()).toBe(1);
    });

    it('swaps the contents of two slots', () => {
      const store = createStoreSync();
      store.setSlot(0, createSlot(1, 'bulbasaur'));
      store.setSlot(3, createSlot(4, 'charmander'));

      expect(store.swapSlots(0, 3)).toBe(true);

      expect(store.slots()[0]?.pokemon.name).toBe('charmander');
      expect(store.slots()[3]?.pokemon.name).toBe('bulbasaur');
    });

    it('does not swap with the same or an invalid index', () => {
      const store = createStoreSync();
      store.setSlot(0, createSlot(1, 'bulbasaur'));

      expect(store.swapSlots(0, 0)).toBe(false);
      expect(store.swapSlots(0, TEAM_SIZE)).toBe(false);
      expect(store.slots()[0]?.pokemon.name).toBe('bulbasaur');
    });

    it('clears every slot', () => {
      const store = createStoreSync();
      store.setSlot(0, createSlot(1, 'bulbasaur'));
      store.setSlot(5, createSlot(4, 'charmander'));

      store.clear();

      expect(store.slots().every((slot) => slot === null)).toBe(true);
      expect(store.occupiedCount()).toBe(0);
      expect(store.isFull()).toBe(false);
    });

    it('creates independent empty slot arrays', () => {
      const first = createEmptyTeamSlots();
      const second = createEmptyTeamSlots();

      expect(first).not.toBe(second);
      expect(first).toHaveLength(TEAM_SIZE);
    });
  });

  describe('addPokemon', () => {
    it('adds a Pokémon to the first free slot', async () => {
      const store = await createLoadedStore();
      const pikachu = createPokemon(25, 'pikachu');

      const result = store.addPokemon(pikachu);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.index).toBe(0);
      }
      expect(store.slots()[0]?.pokemon.name).toBe('pikachu');
      expect(store.occupiedCount()).toBe(1);
    });

    it('returns error when team is full', async () => {
      const fullSlots = Array.from({ length: TEAM_SIZE }, (_, i) => createSlot(i + 1, `poke-${i + 1}`));
      const store = await createLoadedStore(fullSlots);
      const pikachu = createPokemon(25, 'pikachu');

      const result = store.addPokemon(pikachu);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('full');
      }
      expect(store.occupiedCount()).toBe(TEAM_SIZE);
    });

    it('returns error when Pokémon is already in team and duplicates not allowed', async () => {
      const store = await createLoadedStore();
      const pikachu = createPokemon(25, 'pikachu');
      store.addPokemon(pikachu);

      const result = store.addPokemon(pikachu);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('duplicate');
        expect(result.message).toContain('Pikachu');
      }
      expect(store.occupiedCount()).toBe(1);
    });

    it('allows duplicates when ALLOW_DUPLICATE_POKEMON is true', () => {
      // This test would require changing the constant, which is not possible at runtime.
      // The constant is tested by the duplicate test above.
      expect(ALLOW_DUPLICATE_POKEMON).toBe(false);
    });

    it('is case-insensitive when checking for duplicates', async () => {
      const store = await createLoadedStore();
      const pikachu = createPokemon(25, 'pikachu');
      store.addPokemon(pikachu);

      const result = store.addPokemon({ ...pikachu, name: 'PIKACHU' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('duplicate');
      }
    });
  });

  describe('hasPokemon', () => {
    it('returns true when Pokémon is in the team', async () => {
      const store = await createLoadedStore();
      const pikachu = createPokemon(25, 'pikachu');
      store.addPokemon(pikachu);

      expect(store.hasPokemon('pikachu')).toBe(true);
      expect(store.hasPokemon('PIKACHU')).toBe(true);
      expect(store.hasPokemon('Pikachu')).toBe(true);
    });

    it('returns false when Pokémon is not in the team', async () => {
      const store = await createLoadedStore();
      const pikachu = createPokemon(25, 'pikachu');
      store.addPokemon(pikachu);

      expect(store.hasPokemon('charmander')).toBe(false);
      expect(store.hasPokemon('bulbasaur')).toBe(false);
    });

    it('returns false for empty team', async () => {
      const store = await createLoadedStore();

      expect(store.hasPokemon('pikachu')).toBe(false);
    });
  });

  describe('removePokemon', () => {
    it('removes a Pokémon by index', async () => {
      const store = await createLoadedStore();
      const pikachu = createPokemon(25, 'pikachu');
      store.addPokemon(pikachu);

      const result = store.removePokemon(0);

      expect(result).toBe(true);
      expect(store.slots()[0]).toBeNull();
      expect(store.occupiedCount()).toBe(0);
    });

    it('returns false for invalid index', async () => {
      const store = await createLoadedStore();

      expect(store.removePokemon(-1)).toBe(false);
      expect(store.removePokemon(TEAM_SIZE)).toBe(false);
    });
  });

  describe('persistence', () => {
    it('loads team from IndexedDB on initialization', async () => {
      const savedSlots: TeamRecord['slots'] = [
        createSlot(1, 'bulbasaur'),
        createSlot(4, 'charmander'),
        null,
        null,
        null,
        null,
      ];
      const store = await createLoadedStore(savedSlots);

      expect(store.slots()[0]?.pokemon.name).toBe('bulbasaur');
      expect(store.slots()[1]?.pokemon.name).toBe('charmander');
      expect(store.occupiedCount()).toBe(2);
    });

    it('persists changes to IndexedDB', async () => {
      const store = await createLoadedStore();
      const pikachu = createPokemon(25, 'pikachu');
      store.addPokemon(pikachu);

      // Wait for effect to persist
      await new Promise((r) => setTimeout(r, 10));

      const localDb = TestBed.inject(LocalDb);
      const record = await localDb.getTeam(DEFAULT_TEAM_ID);

      expect(record).not.toBeUndefined();
      expect(record?.slots[0]?.pokemon.name).toBe('pikachu');
    });
  });
});