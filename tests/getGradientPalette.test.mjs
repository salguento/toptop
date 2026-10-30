import assert from "node:assert/strict";
import test from "node:test";
import getGradientPalette from "../utils/getGradientPalette.ts";

const color = (hex, area, saturation = 0, lightness = 0.5) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return {
    hex,
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
    area,
    hue: 0,
    saturation,
    lightness,
    intensity: saturation,
  };
};

test("vibrant artwork colors win over dominant neutrals without mutating input", () => {
  for (const [hex, lightness] of [["#000000", 0], ["#ffffff", 1], ["#777777", 0.47]]) {
    const candidates = [color("#ff0000", 0.1, 1), color(hex, 0.9, 0, lightness)];
    const original = structuredClone(candidates);
    const result = getGradientPalette([candidates, candidates], 300);
    assert.deepEqual(result.colors, ["#ff0000", "#ff0000"]);
    assert.deepEqual(candidates, original);
  }
});

test("tiny saturated noise does not replace a representative artwork color", () => {
  const representative = color("#465e70", 0.995, 0.2);
  const noise = color("#ff6600", 0.005, 1);
  const candidates = [noise, representative];
  const result = getGradientPalette([candidates, candidates], 300);
  assert.deepEqual(result.colors, [representative.hex, representative.hex]);
});

test("monochrome covers retain their neutral color", () => {
  for (const hex of ["#000000", "#ffffff", "#777777"]) {
    const candidates = [color(hex, 1)];
    assert.deepEqual(getGradientPalette([candidates, candidates], 300).colors, [hex, hex]);
  }
});

test("coverage still favors representative colors among equally vivid candidates", () => {
  const candidates = [color("#ff0000", 0.1, 1), color("#0000ff", 0.9, 1)];
  const result = getGradientPalette([candidates, candidates], 300);
  assert.deepEqual(result.colors, ["#0000ff", "#0000ff"]);
});

test("scrobble thresholds preserve counts, album order and weights", () => {
  const sets = Array.from({ length: 5 }, () => [color("#777777", 1)]);
  for (const [scrobbles, weights] of [
    [0, [0.5, 0.5]],
    [300, [0.5, 0.5]],
    [301, [0.5, 0.3, 0.2]],
    [600, [0.5, 0.3, 0.2]],
    [601, [0.5, 0.25, 0.15, 0.1]],
    [900, [0.5, 0.25, 0.15, 0.1]],
    [901, [0.5, 0.2, 0.15, 0.1, 0.05]],
  ]) {
    const result = getGradientPalette(sets, scrobbles);
    assert.equal(result.colorCount, weights.length);
    assert.equal(result.colors.length, weights.length);
    assert.deepEqual(result.weights, weights);
  }
});

test("harmony softens contrast while keeping album colors recognizable and in order", () => {
  const result = getGradientPalette([
    [color("#ff0000", 1, 1)],
    [color("#0000ff", 1, 1)],
  ], 300);
  const [first, second] = result.colors.map((hex) => color(hex, 1));
  assert.notDeepEqual(result.colors, ["#ff0000", "#0000ff"]);
  assert.ok(first.red > 230 && first.blue < 70);
  assert.ok(second.blue > 230 && second.red < 70);
  assert.ok(first.blue > 0 && second.red > 0);
});

test("missing artwork keeps all slots and produces valid colors and contrast", () => {
  const result = getGradientPalette([], 1000);
  assert.equal(result.colors.length, 5);
  result.colors.forEach((hex) => assert.match(hex, /^#[0-9a-f]{6}$/));
  Object.values(result.contrast).forEach((ratio) => assert.ok(ratio >= 1 && ratio <= 21));
});

test("text contrast is recalculated from the harmonized palette", () => {
  const result = getGradientPalette([
    [color("#000000", 1)],
    [color("#ffffff", 1)],
  ], 300);
  const luminances = result.colors.map((hex) => {
    const { red, green, blue } = color(hex, 1);
    const linear = [red, green, blue].map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  });
  const black = luminances.map((value) => (value + 0.05) / 0.05);
  const white = luminances.map((value) => 1.05 / (value + 0.05));
  assert.equal(result.contrast.black, Number(((black[0] + black[1]) / 2).toFixed(2)));
  assert.equal(result.contrast.white, Number(((white[0] + white[1]) / 2).toFixed(2)));
});
