export interface ItemTopTop {
  user: User;
  tracks: Tracks;
  artists: Artist[];
  albums: Album[];
  number1: Number1[];
  grid: Image[];
  genres: string[];
  colors: Color[];
}

export interface User {
  name: string;
  img: string;
}

export interface Tracks {
  scrobbleCount: number;
  tracks: Track[];
}

export interface Track {
  count: string;
  track: string;
}

export interface Artist {
  artist: string;
  count: string;
  image: Image[];
}

export interface Image {
  "#text": string;
  size: string;
}

export interface Album {
  album: string;
  artist: string;
  count: string;
  image: Image[];
}

export interface Number1 {
  album: string;
  artist: string;
  count: string;
  image: Image;
}

export interface Color {
  area: number;
  blue: number;
  green: number;
  red: number;
  hex: string;
  hue: number;
  intensity: number;
  lightness: number;
  pRation?: number;
  saturation: number;
}
