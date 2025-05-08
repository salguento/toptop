import { defineStore } from "pinia";
import type {
  ItemTopTop,
  User,
  Tracks,
  Artist,
  Album,
  Number1,
  Image,
  Color,
} from "~/types/ItemTopTop";

export const useTopTopStore = defineStore("toptop", {
  state: (): ItemTopTop => ({
    user: {
      name: "",
      img: "",
    },
    tracks: {
      trackCount: "",
      tracks: [],
    },
    artists: [],
    albums: [],
    number1: [],
    grid: [],
    genres: [],
    colors: [],
  }),
  actions: {
    setUser(user: User) {
      this.user = user;
    },
    setTracks(tracks: Tracks) {
      this.tracks = tracks;
    },
    setArtist(artists: Artist[]) {
      this.artists = artists;
    },
    setAlbums(albums: Album[]) {
      this.albums = albums;
    },
    setNumber1(number1: Number1[]) {
      this.number1 = number1;
    },
    setGrid(grid: Image[]) {
      this.grid = grid;
    },
    setGenres(genres: string[]) {
      this.genres = genres;
    },
    setColors(colors: Color[]) {
      this.colors = colors;
    },
  },
  getters: {
    getItem: (state) => {
      return state;
    },
  },
});
