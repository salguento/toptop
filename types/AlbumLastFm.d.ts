export interface TopAlbums {
  topalbums: {
    "@attr": {
      page: string;
      perPage: string;
      total: string;
      totalPages: string;
      user: string;
    };
    album: Album[];
  };
}

export interface Album {
  "@attr": {
    rank: string;
  };

  artist: {
    mbid: string;
    name: string;
    url: string;
  };
  image: Image[];
  mbid: string;
  name: string;
  playcount: string;
  url: string;
}

interface Image {
  "#text": string;
  size: string;
}
