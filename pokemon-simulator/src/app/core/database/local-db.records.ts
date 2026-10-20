import { TeamSlot } from '../models';

export interface MetaRecord {
  readonly key: string;
  readonly value: unknown;
  readonly updatedAt: number;
}

export interface SpriteRecord {
  readonly pokemonId: number;
  readonly blob: Blob;
  readonly fetchedAt: number;
}

export interface TeamRecord {
  readonly id: string;
  readonly trainerId: string;
  readonly name: string;
  readonly slots: readonly (TeamSlot | null)[];
  readonly updatedAt: number;
}

export interface TrainerRecord {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly updatedAt: number;
}
