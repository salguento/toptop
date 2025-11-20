import { extractColors } from "extract-colors";
import type { Color, Number1 } from "~/types/ItemTopTop";

const getColors = async (image: string) => {
  let colors;
  let p = 10000;
  let d = 0.2;
  let s = 0.2;
  let l = 0;
  let h = 0.083;
  colors = await extractColors(image, {
    pixels: p,
    distance: d,
    saturationDistance: s,
    lightnessDistance: l,
    hueDistance: h,
  });

  while (colors.length < 8) {
    d -= 0.01;
    colors = await extractColors(image, {
      pixels: p,
      distance: d,
      saturationDistance: s,
      lightnessDistance: l,
      hueDistance: h,
    });
  }

  while (colors.length > 10) {
    d += 0.01;
    colors = await extractColors(image, {
      pixels: p,
      distance: d,
      saturationDistance: s,
      lightnessDistance: l,
      hueDistance: h,
    });
  }
  colors.sort((a, b) => a.lightness - b.lightness);
  console.log(colors);
  return colors;
};

export default getColors;
