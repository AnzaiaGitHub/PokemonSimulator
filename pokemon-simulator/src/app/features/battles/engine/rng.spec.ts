import { createSeededRng } from './rng';

describe('createSeededRng', () => {
  it('produces the same sequence for the same seed', () => {
    const first = createSeededRng(42);
    const second = createSeededRng(42);

    expect(Array.from({ length: 10 }, () => first.next())).toEqual(
      Array.from({ length: 10 }, () => second.next()),
    );
  });

  it('produces different sequences for different seeds', () => {
    const first = createSeededRng(1);
    const second = createSeededRng(2);

    expect(first.next()).not.toBe(second.next());
  });

  it('returns integers inside the inclusive range', () => {
    const rng = createSeededRng(7);

    for (let index = 0; index < 100; index += 1) {
      const value = rng.integer(1, 100);

      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(100);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});
