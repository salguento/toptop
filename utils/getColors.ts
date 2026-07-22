import { extractColors } from "extract-colors";

const TARGET_MIN_COLORS = 8;
const TARGET_MAX_COLORS = 10;
const MAX_ATTEMPTS = 8;
const DISTANCE_STEP = 0.025;

const colorCountDistance = (count: number) => {
  if (count < TARGET_MIN_COLORS) return TARGET_MIN_COLORS - count;
  if (count > TARGET_MAX_COLORS) return count - TARGET_MAX_COLORS;
  return 0;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.addEventListener(
      "load",
      async () => {
        try {
          await image.decode();
        } catch {
          // The loaded image can still be used when explicit decoding is unavailable.
        }
        resolve(image);
      },
      { once: true },
    );
    image.addEventListener(
      "error",
      () => reject(new Error("Unable to load artwork for color extraction")),
      { once: true },
    );
    image.src = src;
  });

const getColors = async (image: string) => {
  let distance = 0.2;
  let bestColors: Awaited<ReturnType<typeof extractColors>> = [];
  const imageUrl = `/api/image?url=${encodeURIComponent(image)}`;

  try {
    const decodedImage = await loadImage(imageUrl);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const colors = await extractColors(decodedImage, {
        pixels: 10000,
        distance,
        saturationDistance: 0.2,
        lightnessDistance: 0,
        hueDistance: 0.083,
      });

      if (
        bestColors.length === 0 ||
        colorCountDistance(colors.length) < colorCountDistance(bestColors.length)
      ) {
        bestColors = colors;
      }

      if (
        colors.length >= TARGET_MIN_COLORS &&
        colors.length <= TARGET_MAX_COLORS
      ) {
        bestColors = colors;
        break;
      }

      const adjustment =
        colors.length < TARGET_MIN_COLORS ? -DISTANCE_STEP : DISTANCE_STEP;
      const nextDistance = Math.min(1, Math.max(0, distance + adjustment));

      if (nextDistance === distance) break;
      distance = nextDistance;
    }
  } catch (error) {
    console.error("Unable to extract artwork colors", error);
    return [];
  }

  return bestColors.sort((a, b) => a.lightness - b.lightness);
};

export default getColors;
