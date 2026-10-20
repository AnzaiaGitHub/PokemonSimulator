import { Move } from '../../../core/models';
import { isDamagingMove } from './damage';

export const MAX_BATTLE_MOVES = 4;

export function pickBattleMoves(
  moves: readonly Move[],
  limit: number = MAX_BATTLE_MOVES,
): readonly Move[] {
  return [...moves]
    .filter(isDamagingMove)
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function toggleBattleMove(
  selected: readonly Move[],
  move: Move,
  limit: number = MAX_BATTLE_MOVES,
): readonly Move[] {
  if (selected.some((current) => current.name === move.name)) {
    return selected.filter((current) => current.name !== move.name);
  }

  if (selected.length >= limit) {
    return selected;
  }

  return [...selected, move];
}
