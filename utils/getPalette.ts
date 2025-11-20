import type { Color } from "~/types/ItemTopTop";

const getPalette = (color: Color[]) => {
  let primary;
  let secondary;
  let text;
  let pLightness;
  let lightIndex,
    darkIndex = 0;

  const darkHex = (color: Color[]) => {
    color.sort((a, b) => a.lightness - b.lightness);
    return color[0].hex;
  };

  const lightHex = (color: Color[]) => {
    color.sort((a, b) => b.lightness - a.lightness);
    return color[0].hex;
  };

  color.forEach((i) => {
    i.pRation = i.area * 3 + i.intensity * 4 - i.lightness;
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
  pLightness = color[0].lightness + color[1].lightness;

  if (pLightness > 1) {
    text = "#000000";
  } else {
    text = "#ffffff";
  }

  if (primary === text || secondary === text) {
    text = secondary;
    secondary = primary;
  }

  console.log(pLightness);
  return { primary: primary, secondary: secondary, text: text };
};

export default getPalette;
