import { createTypeChart, TEST_TYPE_CHART } from './testing/battle-fixtures';
import { calculateTypeEffectiveness } from './type-effectiveness';

describe('calculateTypeEffectiveness', () => {
  it('returns zero when the defender is immune', () => {
    expect(calculateTypeEffectiveness('normal', ['ghost'], TEST_TYPE_CHART).multiplier).toBe(0);
    expect(calculateTypeEffectiveness('electric', ['ground'], TEST_TYPE_CHART).multiplier).toBe(0);
  });

  it('returns 0.5 for a resistance and 0.25 for a double resistance', () => {
    expect(calculateTypeEffectiveness('fire', ['water'], TEST_TYPE_CHART).multiplier).toBe(0.5);
    expect(calculateTypeEffectiveness('fire', ['water', 'fire'], TEST_TYPE_CHART).multiplier).toBe(
      0.25,
    );
  });

  it('returns 2 for a weakness and 4 for a double weakness', () => {
    expect(calculateTypeEffectiveness('fire', ['grass'], TEST_TYPE_CHART).multiplier).toBe(2);
    expect(calculateTypeEffectiveness('fire', ['grass', 'ice'], TEST_TYPE_CHART).multiplier).toBe(
      4,
    );
  });

  it('keeps neutral damage when the type chart has no data', () => {
    const emptyChart = createTypeChart([]);

    expect(calculateTypeEffectiveness('water', ['fire'], emptyChart).multiplier).toBe(1);
  });

  it('reports the multiplier applied to each defending type', () => {
    const result = calculateTypeEffectiveness('fire', ['grass', 'water'], TEST_TYPE_CHART);

    expect(result.parts).toEqual([
      { type: 'grass', multiplier: 2 },
      { type: 'water', multiplier: 0.5 },
    ]);
    expect(result.multiplier).toBe(1);
  });
});
