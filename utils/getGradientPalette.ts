export type GradientColorCount = 2 | 3 | 4 | 5;

export interface ExtractedArtworkColor {
  hex: string;
  red: number;
  green: number;
  blue: number;
  area: number;
  hue: number;
  saturation: number;
  lightness: number;
  intensity: number;
}

export interface GradientPalette {
  colorCount: GradientColorCount;
  colors: string[];
  weights: number[];
  text: "#000000" | "#ffffff";
  contrast: {
    black: number;
    white: number;
    minimumBlack: number;
    minimumWhite: number;
  };
}

const COLOR_WEIGHTS: Record<GradientColorCount, number[]> = {
  2: [0.5, 0.5],
  3: [0.5, 0.3, 0.2],
  4: [0.5, 0.25, 0.15, 0.1],
  5: [0.5, 0.2, 0.15, 0.1, 0.05],
};

const FALLBACK_COLORS = [
  "#4338ca",
  "#0891b2",
  "#c026d3",
  "#db2777",
  "#d97706",
];

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export const getGradientColorCount = (
  scrobbleCount: number,
): GradientColorCount => {
  if (scrobbleCount <= 300) return 2;
  if (scrobbleCount <= 600) return 3;
  if (scrobbleCount <= 900) return 4;
  return 5;
};

export const getGradientColorWeights = (count: GradientColorCount) => [
  ...COLOR_WEIGHTS[count],
];

// Area is the fraction of sampled artwork pixels represented by each color.
// Keep neutrals and repeated colors: they may define the cover's identity.
const selectAlbumColor = (candidates: ExtractedArtworkColor[]) =>
  candidates.reduce<ExtractedArtworkColor | undefined>(
    (dominant, candidate) =>
      !dominant || candidate.area > dominant.area ? candidate : dominant,
    undefined,
  );

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  };
};

type Oklab = [number, number, number];

const toOklab = (hex: string): Oklab => {
  const { red, green, blue } = hexToRgb(hex);
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const fromOklab = ([lightness, a, b]: Oklab) => {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return `#${channels
    .map((channel) => {
      const value = channel <= 0.0031308
        ? channel * 12.92
        : 1.055 * channel ** (1 / 2.4) - 0.055;
      return Math.round(clamp(value) * 255).toString(16).padStart(2, "0");
    })
    .join("")}`;
};

const harmonizeColors = (colors: string[], weights: number[]) => {
  const palette = colors.map(toOklab);
  const center: Oklab = [0, 0, 0];

  palette.forEach((color, index) => {
    color.forEach((channel, axis) => {
      center[axis] += channel * weights[index];
    });
  });

  // A small perceptual blend softens differences while retaining each cover's
  // dominant color. Using the existing weights preserves album prominence.
  const strength = 0.12;
  return palette.map((color) =>
    fromOklab([
      color[0] + (center[0] - color[0]) * strength,
      color[1] + (center[1] - color[1]) * strength,
      color[2] + (center[2] - color[2]) * strength,
    ]),
  );
};

const relativeLuminance = (hex: string) => {
  const { red, green, blue } = hexToRgb(hex);
  const channels = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrastRatio = (first: number, second: number) =>
  (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);

const getTextContrast = (colors: string[], weights: number[]) => {
  const luminances = colors.map(relativeLuminance);
  const blackRatios = luminances.map((color) => contrastRatio(color, 0));
  const whiteRatios = luminances.map((color) => contrastRatio(color, 1));
  const weightedBlack = blackRatios.reduce(
    (total, ratio, index) => total + ratio * weights[index],
    0,
  );
  const weightedWhite = whiteRatios.reduce(
    (total, ratio, index) => total + ratio * weights[index],
    0,
  );
  const minimumBlack = Math.min(...blackRatios);
  const minimumWhite = Math.min(...whiteRatios);
  const blackScore = weightedBlack * 0.8 + minimumBlack * 0.2;
  const whiteScore = weightedWhite * 0.8 + minimumWhite * 0.2;

  return {
    text: (blackScore > whiteScore ? "#000000" : "#ffffff") as
      | "#000000"
      | "#ffffff",
    contrast: {
      black: Number(weightedBlack.toFixed(2)),
      white: Number(weightedWhite.toFixed(2)),
      minimumBlack: Number(minimumBlack.toFixed(2)),
      minimumWhite: Number(minimumWhite.toFixed(2)),
    },
  };
};

export const getGradientPalette = (
  albumColorSets: ExtractedArtworkColor[][],
  scrobbleCount: number,
): GradientPalette => {
  const colorCount = getGradientColorCount(scrobbleCount);
  const weights = getGradientColorWeights(colorCount);
  const dominantColors: string[] = [];

  for (let index = 0; index < colorCount; index++) {
    const candidate = selectAlbumColor(albumColorSets[index] ?? []);
    dominantColors.push(candidate?.hex ?? FALLBACK_COLORS[index]);
  }

  const colors = harmonizeColors(dominantColors, weights);
  const { text, contrast } = getTextContrast(colors, weights);

  return {
    colorCount,
    colors,
    weights,
    text,
    contrast,
  };
};

export default getGradientPalette;
