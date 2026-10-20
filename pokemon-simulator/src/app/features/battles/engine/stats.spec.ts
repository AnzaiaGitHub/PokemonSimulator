import { calculateBattleStats, calculateHpStat, calculateOtherStat } from './stats';

describe('battle stats', () => {
  it('calculates HP with the level 50 formula', () => {
    expect(calculateHpStat(100)).toBe(160);
    expect(calculateHpStat(45)).toBe(105);
  });

  it('calculates the other stats with the level 50 formula', () => {
    expect(calculateOtherStat(100)).toBe(105);
    expect(calculateOtherStat(49)).toBe(54);
  });

  it('maps every base stat to its battle value', () => {
    expect(
      calculateBattleStats({
        hp: 100,
        attack: 80,
        defense: 90,
        specialAttack: 110,
        specialDefense: 120,
        speed: 130,
      }),
    ).toEqual({
      hp: 160,
      attack: 85,
      defense: 95,
      specialAttack: 115,
      specialDefense: 125,
      speed: 135,
    });
  });

  it('supports another level for calculations and tests', () => {
    expect(calculateHpStat(100, 100)).toBe(310);
    expect(calculateOtherStat(100, 100)).toBe(205);
  });
});
