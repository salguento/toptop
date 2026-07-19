import type { Color } from "~/types/ItemTopTop";

const DEFAULT_PALETTE = {
  primary: "#020617",
  secondary: "#334155",
  text: "#ffffff",
};

const getPalette = (colors: Color[]) => {
  if (colors.length === 0) return DEFAULT_PALETTE;

  let rankedColors = colors
    .map((color) => ({
      ...color,
      pRation: color.area * 3 + color.intensity * 4 - color.lightness,
    }))
    .sort((a, b) => b.pRation - a.pRation);

  if (
    rankedColors.length >= 3 &&
    Math.round(rankedColors[0].lightness) !==
      Math.round(rankedColors[1].lightness) &&
    rankedColors[2].pRation < -0.1
  ) {
    rankedColors = rankedColors
      .map((color) => ({
        ...color,
        pRation: color.area + color.intensity + color.lightness / 2,
      }))
      .sort((a, b) => b.pRation - a.pRation);
  }

  const primaryColor = rankedColors[0];
  const secondaryColor = rankedColors[1] ?? primaryColor;
  const text =
    primaryColor.lightness + secondaryColor.lightness > 1
      ? "#000000"
      : "#ffffff";

  return {
    primary: primaryColor.hex,
    secondary: secondaryColor.hex,
    text,
  };
};

export default getPalette;
