export interface Artists {
  topartists: {
    "@attr": {
      page: string;
      perPage: string;
      total: string;
      totalPages: string;
      user: string;
    };
    artist: Artist[];
  };
}

interface Artist {
  "@attr": {
    rank: string;
  };
  image: Image[];
  mbid: string;
  name: string;
  playcount: string;
  streamable: string;
  url: string;
}

interface Image {
  "#text": string;
  size: string;
}
