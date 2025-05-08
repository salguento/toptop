export interface UserInfo {
  user: {
    name: string;
    age: string;
    albumCount: string;
    artistCount: string;
    bootstrap: string;
    country: string;
    gendenr: string;
    image: UserImage[];
    playcount: string;
    playlists: string;
    realname: string;
    registered: object;
    subscriber: string;
    trackCount: string;
    url: string;
  };
}

export interface UserImage {
  size: string;
  "#text": string;
}
