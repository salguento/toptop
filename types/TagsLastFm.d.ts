export interface TagsLastFm {
  toptags: {
    "@attr": {
      artist: string;
      album: string;
    };
    tag: Tag[];
  };
}

interface Tag {
  count: number;
  name: string;
  url: string;
  length: number;
}

export interface Genre {
  name: string;
  playcount: string;
}
