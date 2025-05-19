import type { Color } from "~/types/ItemTopTop";

const getPalette = (color: Color[]) => {
  let primary;
  let secondary;
  let text;
  let pLightness;
  let lightIndex = 0;
  let darkIndex = 0;

  const darkHex = (color: Color[]) => {
    color.sort((a, b) => a.lightness - b.lightness);
    return color[0].hex;
  };

  const lightHex = (color: Color[]) => {
    color.sort((a, b) => b.lightness - a.lightness);
    return color[0].hex;
  };

  color.forEach((i) => {
    i.pRation = i.area * 3 + i.intensity * 2 - i.lightness;
    if (i.lightness > 0.5) {
      lightIndex += 1;
    } else {
      darkIndex += 1;
    }
  });
  color.sort((a, b) => b.pRation - a.pRation);

  if (
    Math.round(color[0].lightness) !== Math.round(color[1].lightness) &&
    color[2].pRation < -0.1
  ) {
    color.forEach((i) => {
      i.pRation = i.area + i.intensity + i.lightness / 2;
    });
    color = color.sort((a, b) => b.pRation - a.pRation);
  }

  primary = color[0].hex;
  secondary = color[1].hex;
  pLightness =
    Math.round(color[0].lightness + color[0].saturation) +
    Math.round(color[1].lightness + color[1].saturation);

  if (color.length === lightIndex) {
    text = "#000000";
  } else if (color.length === darkIndex) {
    text = "#ffffff";
  } else if (pLightness < 2.5) {
    text = lightHex(color);
    if (text == primary || text == secondary) {
      text = darkHex(color);
    }
  } else {
    text = darkHex(color);
    if (text == primary || text == secondary) {
      text = lightHex(color);
    }
  }

  if (primary === text || secondary === text) {
    text = secondary;
    secondary = primary;
  }
  return { primary: primary, secondary: secondary, text: text };
};

export default getPalette;
