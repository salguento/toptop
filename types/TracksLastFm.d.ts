export interface TracksLastFm {
  toptracks: {
    "@attr": {
      page: string;
      perPage: string;
      total: string;
      totalPages: string;
      user: string;
    };
    track: Track[];
  };
}

interface Track {
  "@attr": {
    rank: string;
  };
  artist: {
    mbid: string;
    name: string;
    url: string;
  };
  duration: string;
  image: TrackImage[];
  mbid: string;
  name: string;
  playcount: string;
  streamable: { "#text": string; fulltrack: string };
  url: string;
}

interface TrackImage {
  "#text": string;
  size: string;
}
