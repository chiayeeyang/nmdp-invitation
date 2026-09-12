// A bounded, stable visual identity. Existing values 0–2 remain valid.
export function flowerStyle(identity: number) {
  let state = (identity + 1) >>> 0;
  state = Math.imul(state ^ (state >>> 16), 0x45d9f3b) >>> 0;
  state = Math.imul(state ^ (state >>> 16), 0x45d9f3b) >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  // Five curated pastel families; the saved random identity keeps each bloom stable.
  const palettes = [
    { hue: -10, saturation: 1 }, // blush
    { hue: 8, saturation: 1 }, // peach
    { hue: -20, saturation: 0.98 }, // lavender
    { hue: 16, saturation: 0.95 }, // ice blue
    { hue: 0, saturation: 0.9 }, // pearl
  ];
  const palette = palettes[Math.abs(identity) % palettes.length];
  return {
    hue: palette.hue,
    saturation: palette.saturation,
    brightness: 1.04,
    sway: 7 + next() * 4,
    delay: -next() * 10,
    lean: -17 + next() * 34,
    bend: -2.5 + next() * 5,
    facing: next() > 0.5 ? 1 : -1,
    height: 0.87 + next() * 0.23,
    breeze: 0.7 + next() * 1.6,
    nod: -9 + next() * 18,
    turn: -24 + next() * 48,
    scale: 0.91 + next() * 0.16,
    openness: 0.72 + next() * 0.32,
  };
}
export function createFlowerIdentity() {
  return crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff;
}
