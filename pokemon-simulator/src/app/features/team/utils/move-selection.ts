import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Move } from '../../../core/models';

export const MAX_MOVES_PER_POKEMON = 4;

export function hasAttackingMove(moves: readonly Move[]): boolean {
  return moves.some((move) => move.damageClass !== 'status');
}

export function pickDefaultMoves(
  moves: readonly Move[],
  limit: number = MAX_MOVES_PER_POKEMON,
): readonly Move[] {
  return [...moves]
    .filter((move) => move.damageClass !== 'status' && (move.power ?? 0) > 0)
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function formatMoveName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function maxMovesValidator(max: number = MAX_MOVES_PER_POKEMON): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;

    if (!Array.isArray(value)) {
      return null;
    }

    return value.length > max ? { maxMoves: { max, actual: value.length } } : null;
  };
}

export function uniqueMovesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;

    if (!Array.isArray(value)) {
      return null;
    }

    const names = value.map((name) => String(name).trim().toLowerCase());

    return new Set(names).size === names.length ? null : { duplicateMoves: true };
  };
}
