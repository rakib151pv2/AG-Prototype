// Deterministic PRNG (mulberry32) so the generated 45-day demo dataset is
// realistic-looking but stable across reloads — Math.random() would make
// every KPI/chart reshuffle on every page refresh, which is undesirable for
// a demo that's meant to be shown/discussed consistently.
export function createRng(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Uniform float in [min, max).
export function rngRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

// Small daily "wobble" around a base value, e.g. wobble(rng, 100, 0.05) => 95-105.
export function wobble(rng: () => number, base: number, pct: number): number {
  return base * (1 + rngRange(rng, -pct, pct));
}
