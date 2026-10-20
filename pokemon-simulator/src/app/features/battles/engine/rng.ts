export interface SeededRng {
  next(): number;
  integer(min: number, max: number): number;
  chance(probability: number): boolean;
}

export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;

    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };

  return {
    next,
    integer(min: number, max: number): number {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    chance(probability: number): boolean {
      return next() < probability;
    },
  };
}
