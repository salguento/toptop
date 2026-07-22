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

const hueDistance = (first: number, second: number) => {
  const distance = Math.abs(first - second);
  return Math.min(distance, 1 - distance);
};

const rgbDistance = (
  first: ExtractedArtworkColor,
  second: ExtractedArtworkColor,
) =>
  Math.hypot(
    first.red - second.red,
    first.green - second.green,
    first.blue - second.blue,
  ) / Math.sqrt(3 * 255 ** 2);

const artworkRelevance = (color: ExtractedArtworkColor) => {
  const balancedLightness = 1 - Math.min(1, Math.abs(color.lightness - 0.52) * 2);
  const extremeLightnessPenalty =
    color.lightness < 0.08 || color.lightness > 0.94 ? 0.3 : 0;
  const neutralPenalty = color.saturation < 0.08 ? 0.18 : 0;

  return (
    clamp(color.area) * 0.42 +
    clamp(color.saturation) * 0.28 +
    clamp(color.intensity) * 0.18 +
    balancedLightness * 0.12 -
    extremeLightnessPenalty -
    neutralPenalty
  );
};

const harmonyScore = (
  candidate: ExtractedArtworkColor,
  selected: ExtractedArtworkColor[],
) => {
  if (selected.length === 0) return 0;

  return (
    selected.reduce((total, color) => {
      const hue = hueDistance(candidate.hue, color.hue);
      const distance = rgbDistance(candidate, color);
      let relation = 0;

      if (hue <= 0.16) relation = 0.13;
      else if (hue >= 0.42) relation = 0.17;
      else if (hue >= 0.26 && hue <= 0.4) relation = 0.15;
      else relation = 0.06;

      const duplicatePenalty = distance < 0.1 ? 0.42 : 0;
      const distinctionBonus = Math.min(distance, 0.45) * 0.22;

      return total + relation + distinctionBonus - duplicatePenalty;
    }, 0) / selected.length
  );
};

const selectAlbumColor = (
  candidates: ExtractedArtworkColor[],
  selected: ExtractedArtworkColor[],
) =>
  [...candidates].sort((first, second) => {
    const firstScore =
      artworkRelevance(first) * 0.76 + harmonyScore(first, selected) * 0.24;
    const secondScore =
      artworkRelevance(second) * 0.76 + harmonyScore(second, selected) * 0.24;

    return secondScore - firstScore;
  })[0];

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  };
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
  const selectedCandidates: ExtractedArtworkColor[] = [];
  const colors: string[] = [];

  for (let index = 0; index < colorCount; index++) {
    const candidate = selectAlbumColor(
      albumColorSets[index] ?? [],
      selectedCandidates,
    );

    if (candidate) {
      selectedCandidates.push(candidate);
      colors.push(candidate.hex);
    } else {
      colors.push(FALLBACK_COLORS[index]);
    }
  }

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
