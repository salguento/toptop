export interface ArtisticGradientInput {
  colors: string[];
  weights: number[];
}

export interface ArtisticGradientResult {
  id: string;
  index: number;
  name: string;
  backgroundImage: string;
}

interface PreparedGradientInput {
  colors: Array<string | null>;
  weights: number[];
}

interface ArtisticGradientDefinition {
  id: string;
  name: string;
  build: (input: ArtisticGradientInput) => string;
}

const SMOOTH_STOP_POSITIONS: Record<number, number[]> = {
  2: [0, 100],
  3: [40, 60, 100],
  4: [35, 65, 85, 95],
  5: [40, 60, 80, 90, 100],
};

const rgba = (hex: string | null, alpha: number | string) => {
  if (!hex) return "transparent";

  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255} / ${alpha})`;
};

const prepare = ({
  colors,
  weights,
}: ArtisticGradientInput): PreparedGradientInput => ({
  colors: Array.from({ length: 5 }, (_, index) => colors[index] ?? null),
  weights: Array.from({ length: 5 }, (_, index) => weights[index] ?? 0),
});

const softStops = (colors: string[]) => {
  const positions = SMOOTH_STOP_POSITIONS[colors.length];
  const stops = [`${colors[0]} 0%`];

  colors.forEach((color, index) => {
    stops.push(`${color} ${positions[index]}%`);
  });

  stops.push(`${colors.at(-1)} 100%`);
  return stops.join(", ");
};

const baseLinear = (
  angle: string,
  { colors }: ArtisticGradientInput,
) => `linear-gradient(${angle}, ${softStops(colors)})`;

const baseConic = (
  angle: string,
  position: string,
  { colors }: ArtisticGradientInput,
) => `conic-gradient(from ${angle} at ${position}, ${softStops(colors)})`;

const strength = (weight: number, minimum = 0.16) =>
  Math.min(0.72, minimum + weight * 0.78).toFixed(2);

export const ARTISTIC_GRADIENTS: ArtisticGradientDefinition[] = [
  {
    id: "G01",
    name: "Diamond Aurora",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        "radial-gradient(circle at 50% 42%, rgb(255 255 255 / 22%) 0 2%, transparent 24%)",
        `linear-gradient(45deg, transparent 0 36%, ${rgba(c[4], strength(w[4], 0))} 49%, transparent 62%)`,
        `linear-gradient(-45deg, transparent 0 36%, ${rgba(c[3], strength(w[3], 0))} 49%, transparent 62%)`,
        `conic-gradient(from 45deg at 50% 42%, ${rgba(c[0], strength(w[0]))} 0%, ${rgba(c[1], strength(w[1], 0))} 25%, ${rgba(c[2], strength(w[2], 0))} 50%, ${rgba(c[3], strength(w[3], 0))} 75%, ${rgba(c[0], strength(w[0]))} 100%)`,
        baseConic("-18deg", "50% 42%", input),
      ].join(",");
    },
  },
  {
    id: "G02",
    name: "Liquid Mesh",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        `radial-gradient(circle at 18% 22%, ${rgba(c[0], strength(w[0]))} 0 10%, transparent 42%)`,
        `radial-gradient(circle at 82% 18%, ${rgba(c[1], strength(w[1]))} 0 8%, transparent 40%)`,
        `radial-gradient(circle at 74% 78%, ${rgba(c[2], strength(w[2]))} 0 7%, transparent 43%)`,
        `radial-gradient(circle at 22% 82%, ${rgba(c[3], strength(w[3]))} 0 6%, transparent 38%)`,
        `radial-gradient(circle at 52% 48%, ${rgba(c[4], strength(w[4]))}, transparent 36%)`,
        baseLinear("160deg", input),
      ].join(",");
    },
  },
  {
    id: "G03",
    name: "Iridescent Aperture",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        "radial-gradient(circle at 62% 38%, rgb(255 255 255 / 24%) 0%, transparent 3% 12%, rgb(0 0 0 / 18%) 20%, transparent 36%)",
        `radial-gradient(ellipse 86% 58% at 62% 38%, transparent 12%, ${rgba(c[0], strength(w[0]))} 36%, ${rgba(c[1], strength(w[1], 0))} 58%, transparent 82%)`,
        `conic-gradient(from -48deg at 62% 38%, ${rgba(c[0], 0.58)} 0deg, ${rgba(c[1], 0.48)} 78deg, ${rgba(c[2], 0.38)} 154deg, ${rgba(c[3], 0.3)} 228deg, ${rgba(c[4], 0.24)} 302deg, ${rgba(c[0], 0.58)} 360deg)`,
        baseLinear("156deg", input),
      ].join(",");
    },
  },
  {
    id: "G04",
    name: "Prismatic Fold",
    build: (input) => {
      const { colors: c } = prepare(input);
      return [
        `linear-gradient(118deg, transparent 0 18%, ${rgba(c[1], 0.5)} 28%, transparent 38% 100%)`,
        `linear-gradient(64deg, transparent 0 38%, ${rgba(c[2], 0.42)} 48%, transparent 58% 100%)`,
        `linear-gradient(152deg, transparent 0 55%, ${rgba(c[3], 0.34)} 66%, transparent 78% 100%)`,
        "linear-gradient(25deg, rgb(255 255 255 / 9%), transparent 28% 74%, rgb(0 0 0 / 12%))",
        baseLinear("132deg", input),
      ].join(",");
    },
  },
  {
    id: "G05",
    name: "Kaleidoscope Bloom",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        `radial-gradient(circle at 50% 46%, rgb(255 255 255 / 24%) 0 1.5%, transparent 7% 15%, ${rgba(c[4], strength(w[4], 0))} 16% 18%, transparent 19% 29%, ${rgba(c[2], strength(w[2], 0))} 30% 33%, transparent 34% 47%, ${rgba(c[1], strength(w[1], 0))} 48% 51%, transparent 52%)`,
        `repeating-conic-gradient(from 12deg at 50% 46%, transparent 0 10deg, ${rgba(c[0], 0.28)} 11deg 18deg, transparent 19deg 36deg)`,
        `radial-gradient(ellipse 88% 58% at 50% 46%, ${rgba(c[0], strength(w[0]))}, transparent 72%)`,
        baseConic("55deg", "50% 46%", input),
      ].join(",");
    },
  },
  {
    id: "G06",
    name: "Chromatic Monolith",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        "linear-gradient(45deg, transparent 0 41%, rgb(255 255 255 / 13%) 49%, transparent 57%)",
        `linear-gradient(-45deg, transparent 0 41%, ${rgba(c[2], strength(w[2], 0))} 49%, transparent 57%)`,
        `linear-gradient(90deg, ${rgba(c[1], 0.52)} 0 14%, transparent 29% 71%, ${rgba(c[3], 0.42)} 86% 100%)`,
        `radial-gradient(ellipse 38% 58% at 50% 48%, ${rgba(c[0], strength(w[0]))} 0 12%, transparent 68%)`,
        baseLinear("172deg", input),
      ].join(",");
    },
  },
  {
    id: "G07",
    name: "Chromatic Eclipse",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        `radial-gradient(circle at 50% 42%, rgb(3 4 12 / 78%) 0 8%, ${rgba(c[0], strength(w[0]))} 17%, ${rgba(c[1], strength(w[1], 0))} 31%, transparent 57%)`,
        `conic-gradient(from 18deg at 50% 42%, transparent 0%, ${rgba(c[2], 0.34)} 12%, transparent 27%, ${rgba(c[3], 0.28)} 43%, transparent 59%, ${rgba(c[4], 0.24)} 76%, transparent 91% 100%)`,
        `radial-gradient(ellipse 112% 72% at 50% 42%, ${rgba(c[0], 0.2)}, transparent 72%)`,
        baseConic("90deg", "50% 42%", input),
      ].join(",");
    },
  },
  {
    id: "G08",
    name: "Chromatic Current",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        `conic-gradient(from 202deg at -8% 108%, transparent 0%, ${rgba(c[0], strength(w[0]))} 14%, ${rgba(c[1], strength(w[1], 0))} 27%, transparent 48%)`,
        `conic-gradient(from 22deg at 108% -8%, transparent 0%, ${rgba(c[2], strength(w[2], 0))} 16%, ${rgba(c[3], strength(w[3], 0))} 31%, transparent 52%)`,
        "radial-gradient(ellipse 150% 34% at 50% 52%, transparent 12%, rgb(255 255 255 / 15%) 48%, transparent 78%)",
        `linear-gradient(128deg, ${rgba(c[4], strength(w[4], 0))}, transparent 28% 72%, ${rgba(c[1], 0.22)})`,
        baseLinear("128deg", input),
      ].join(",");
    },
  },
  {
    id: "G09",
    name: "Moiré Prism",
    build: (input) => {
      const { colors: c } = prepare(input);
      return [
        `repeating-radial-gradient(ellipse at 36% 44%, transparent 0 3.5%, ${rgba(c[1], 0.19)} 3.8% 4.4%, transparent 4.7% 8.5%)`,
        `repeating-conic-gradient(from 7deg at 64% 54%, transparent 0 5deg, ${rgba(c[2], 0.16)} 6deg 8deg, transparent 9deg 17deg)`,
        "radial-gradient(ellipse 88% 62% at 50% 50%, transparent 16%, rgb(0 0 0 / 24%) 100%)",
        baseConic("-40deg", "50% 50%", input),
      ].join(",");
    },
  },
  {
    id: "G10",
    name: "Diamond Quilt",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        `conic-gradient(from 45deg at 25% 24%, ${rgba(c[0], strength(w[0]))} 0%, transparent 24%, ${rgba(c[2], strength(w[2], 0))} 52%, transparent 78%, ${rgba(c[0], strength(w[0]))} 100%)`,
        `conic-gradient(from 225deg at 76% 76%, ${rgba(c[1], strength(w[1], 0))} 0%, transparent 24%, ${rgba(c[3], strength(w[3], 0))} 52%, transparent 78%, ${rgba(c[1], strength(w[1], 0))} 100%)`,
        "linear-gradient(45deg, transparent 0 47%, rgb(255 255 255 / 14%) 49% 51%, transparent 53%)",
        "linear-gradient(-45deg, transparent 0 47%, rgb(0 0 0 / 16%) 49% 51%, transparent 53%)",
        baseConic("45deg", "50% 50%", input),
      ].join(",");
    },
  },
  {
    id: "G11",
    name: "Silk Caustics",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        `linear-gradient(112deg, transparent 0%, ${rgba(c[1], strength(w[1], 0))} 28%, transparent 56%)`,
        `linear-gradient(68deg, transparent 18%, ${rgba(c[2], strength(w[2], 0))} 48%, transparent 78%)`,
        "radial-gradient(ellipse 110% 38% at 52% 34%, rgb(255 255 255 / 17%) 0%, transparent 72%)",
        `radial-gradient(ellipse 76% 92% at 18% 82%, ${rgba(c[3], strength(w[3], 0))}, transparent 74%)`,
        baseLinear("152deg", input),
      ].join(",");
    },
  },
  {
    id: "G12",
    name: "Magnetic Field",
    build: (input) => {
      const { colors: c } = prepare(input);
      return [
        `repeating-conic-gradient(from 20deg at 50% 54%, transparent 0 7deg, ${rgba(c[3], 0.18)} 8deg 10deg, transparent 11deg 21deg)`,
        `radial-gradient(ellipse 62% 38% at 50% 54%, transparent 0 22%, ${rgba(c[0], 0.52)} 58%, transparent 74%)`,
        baseConic("80deg", "50% 54%", input),
      ].join(",");
    },
  },
  {
    id: "G13",
    name: "Diamond Haze",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        `linear-gradient(45deg, transparent 8%, ${rgba(c[1], strength(w[1], 0))} 48%, transparent 88%)`,
        `linear-gradient(-45deg, transparent 8%, ${rgba(c[2], strength(w[2], 0))} 48%, transparent 88%)`,
        "radial-gradient(ellipse 54% 38% at 50% 48%, rgb(255 255 255 / 20%) 0%, transparent 74%)",
        `radial-gradient(ellipse 86% 66% at 50% 48%, ${rgba(c[0], strength(w[0]))} 0%, ${rgba(c[3], strength(w[3], 0))} 54%, transparent 82%)`,
        baseConic("45deg", "50% 48%", input),
      ].join(",");
    },
  },
  {
    id: "G14",
    name: "Gravity Wells",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        `radial-gradient(circle at 22% 32%, rgb(2 3 10 / 62%) 0 5%, ${rgba(c[0], strength(w[0]))} 16%, ${rgba(c[2], strength(w[2], 0))} 34%, transparent 58%)`,
        `radial-gradient(circle at 78% 70%, rgb(2 3 10 / 58%) 0 6%, ${rgba(c[1], strength(w[1], 0))} 18%, ${rgba(c[3], strength(w[3], 0))} 37%, transparent 62%)`,
        `conic-gradient(from 35deg at 22% 32%, transparent 0deg, ${rgba(c[0], 0.36)} 72deg, transparent 148deg, ${rgba(c[2], 0.28)} 228deg, transparent 310deg 360deg)`,
        `conic-gradient(from 215deg at 78% 70%, transparent 0deg, ${rgba(c[1], 0.34)} 76deg, transparent 154deg, ${rgba(c[4], 0.24)} 236deg, transparent 318deg 360deg)`,
        baseLinear("138deg", input),
      ].join(",");
    },
  },
  {
    id: "G15",
    name: "Diamond Bloom",
    build: (input) => {
      const { colors: c, weights: w } = prepare(input);
      return [
        `radial-gradient(ellipse 26% 58% at 50% 16%, ${rgba(c[1], strength(w[1], 0))}, transparent 72%)`,
        `radial-gradient(ellipse 26% 58% at 84% 50%, ${rgba(c[2], strength(w[2], 0))}, transparent 72%)`,
        `radial-gradient(ellipse 26% 58% at 50% 84%, ${rgba(c[3], strength(w[3], 0))}, transparent 72%)`,
        `radial-gradient(ellipse 26% 58% at 16% 50%, ${rgba(c[4], strength(w[4], 0))}, transparent 72%)`,
        `conic-gradient(from 45deg at 50% 50%, ${rgba(c[0], strength(w[0]))} 0%, ${rgba(c[1], strength(w[1], 0))} 25%, ${rgba(c[2], strength(w[2], 0))} 50%, ${rgba(c[3], strength(w[3], 0))} 75%, ${rgba(c[0], strength(w[0]))} 100%)`,
        "radial-gradient(circle at 50% 50%, rgb(255 255 255 / 20%) 0 2%, transparent 24%)",
        baseConic("12deg", "50% 50%", input),
      ].join(",");
    },
  },
];

export const hashGenre = (genre: string) => {
  const normalizedGenre =
    genre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase() || "unknown";
  let hash = 2166136261;

  for (let index = 0; index < normalizedGenre.length; index++) {
    hash ^= normalizedGenre.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

export const getGradientIndex = (genre: string) =>
  hashGenre(genre) % ARTISTIC_GRADIENTS.length;

export const getArtisticGradient = (
  genre: string,
  input: ArtisticGradientInput,
): ArtisticGradientResult => {
  const index = getGradientIndex(genre);
  const gradient = ARTISTIC_GRADIENTS[index];

  return {
    id: gradient.id,
    index,
    name: gradient.name,
    backgroundImage: gradient.build(input),
  };
};

export default getArtisticGradient;
