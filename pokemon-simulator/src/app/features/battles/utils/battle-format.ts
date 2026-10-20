import { BattleLogEntry } from '../engine';

export function formatIdentifier(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function formatEffectiveness(multiplier: number): string {
  if (multiplier === 0) return 'No effect';
  if (multiplier >= 4) return '4×';
  if (multiplier >= 2) return '2×';
  if (multiplier > 1) return '1.5×';
  if (multiplier === 1) return '1×';
  if (multiplier > 0.5) return '0.75×';
  if (multiplier === 0.5) return '0.5×';
  return '0.25×';
}

export function describeBattleLogEntry(entry: BattleLogEntry): string {
  const attack = `${formatIdentifier(entry.attackerName)} used ${formatIdentifier(entry.moveName)}!`;

  if (entry.missed) {
    return `${attack} It missed!`;
  }

  const details: string[] = [];

  if (entry.critical) {
    details.push('Critical hit!');
  }

  if (entry.typeMultiplier === 0) {
    details.push('It had no effect.');
  } else if (entry.typeMultiplier > 1) {
    details.push("It's super effective!");
  } else if (entry.typeMultiplier < 1) {
    details.push("It's not very effective…");
  }

  return details.length > 0 ? `${attack} ${details.join(' ')}` : attack;
}
