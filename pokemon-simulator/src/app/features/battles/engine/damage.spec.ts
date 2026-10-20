import { MoveDamageClass, PokemonTypeName } from '../../../core/models';
import { calculateDamage } from './damage';
import { calculateBattleStats } from './stats';
import { createMove, TEST_TYPE_CHART } from './testing/battle-fixtures';

const BASE_STATS = {
  hp: 100,
  attack: 100,
  defense: 100,
  specialAttack: 100,
  specialDefense: 100,
  speed: 100,
};

const STATS = calculateBattleStats(BASE_STATS);

function damage(options: {
  readonly damageClass?: MoveDamageClass;
  readonly type?: PokemonTypeName;
  readonly power?: number | null;
  readonly attackerTypes?: readonly PokemonTypeName[];
  readonly defenderTypes?: readonly PokemonTypeName[];
  readonly critical?: boolean;
  readonly randomMultiplier?: number;
  readonly weather?: 'clear' | 'sun' | 'rain';
}) {
  return calculateDamage({
    attackerStats: STATS,
    attackerTypes: options.attackerTypes ?? ['water'],
    defenderStats: STATS,
    defenderTypes: options.defenderTypes ?? ['normal'],
    move: createMove('test-move', {
      type: options.type ?? 'normal',
      damageClass: options.damageClass ?? 'physical',
      power: options.power ?? 80,
    }),
    weather: options.weather ?? 'clear',
    typeChart: TEST_TYPE_CHART,
    critical: options.critical ?? false,
    randomMultiplier: options.randomMultiplier ?? 1,
  });
}

describe('calculateDamage', () => {
  it('uses the simplified level 50 formula for a neutral hit', () => {
    const result = damage({});

    expect(result.baseDamage).toBe(37);
    expect(result.total).toBe(37);
    expect(result.attackStatName).toBe('attack');
  });

  it('uses special stats for special moves', () => {
    const result = damage({ damageClass: 'special' });

    expect(result.attackStatName).toBe('specialAttack');
    expect(result.defenseStatName).toBe('specialDefense');
  });

  it('applies STAB when the move type matches an attacker type', () => {
    const result = damage({ type: 'fire', attackerTypes: ['fire'] });

    expect(result.stabMultiplier).toBe(1.5);
    expect(result.total).toBe(55);
  });

  it('applies the critical multiplier', () => {
    const result = damage({ critical: true });

    expect(result.criticalMultiplier).toBe(1.5);
    expect(result.total).toBe(55);
  });

  it('applies type effectiveness including double weakness', () => {
    const result = damage({ type: 'fire', defenderTypes: ['grass', 'ice'] });

    expect(result.typeMultiplier).toBe(4);
    expect(result.total).toBe(148);
  });

  it('returns zero damage for immunities', () => {
    const result = damage({ type: 'normal', defenderTypes: ['ghost'] });

    expect(result.typeMultiplier).toBe(0);
    expect(result.total).toBe(0);
  });

  it('ignores status moves', () => {
    const result = damage({ damageClass: 'status', power: null });

    expect(result.total).toBe(0);
    expect(result.baseDamage).toBe(0);
  });

  it('applies the weather multiplier', () => {
    expect(damage({ type: 'fire', weather: 'sun' }).weatherMultiplier).toBe(1.5);
    expect(damage({ type: 'fire', weather: 'rain' }).weatherMultiplier).toBe(0.5);
  });

  it('applies the random multiplier and clamps it to 0.85–1', () => {
    expect(damage({ randomMultiplier: 0.85 }).total).toBe(31);
    expect(damage({ randomMultiplier: 0.1 }).randomMultiplier).toBe(0.85);
    expect(damage({ randomMultiplier: 2 }).randomMultiplier).toBe(1);
  });

  it('returns the breakdown of the modifiers that were applied', () => {
    const result = damage({
      type: 'fire',
      attackerTypes: ['fire'],
      defenderTypes: ['grass'],
      weather: 'sun',
      critical: true,
      randomMultiplier: 1,
    });

    expect(result).toMatchObject({
      typeMultiplier: 2,
      stabMultiplier: 1.5,
      criticalMultiplier: 1.5,
      weatherMultiplier: 1.5,
      randomMultiplier: 1,
    });
    expect(result.typeParts).toEqual([{ type: 'grass', multiplier: 2 }]);
  });
});
