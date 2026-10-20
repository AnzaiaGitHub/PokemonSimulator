import { getWeatherMultiplier } from './weather';

describe('weather damage multipliers', () => {
  it('does not modify damage when the weather is clear', () => {
    expect(getWeatherMultiplier('clear', 'fire')).toBe(1);
    expect(getWeatherMultiplier('clear', 'water')).toBe(1);
  });

  it('boosts Fire and weakens Water in the sun', () => {
    expect(getWeatherMultiplier('sun', 'fire')).toBe(1.5);
    expect(getWeatherMultiplier('sun', 'water')).toBe(0.5);
    expect(getWeatherMultiplier('sun', 'electric')).toBe(1);
  });

  it('boosts Water and weakens Fire in the rain', () => {
    expect(getWeatherMultiplier('rain', 'water')).toBe(1.5);
    expect(getWeatherMultiplier('rain', 'fire')).toBe(0.5);
  });
});
