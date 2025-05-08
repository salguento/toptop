import { storeToRefs } from "pinia";
import { useTopTopStore } from "@/stores/TopTopStore";
import type { TopAlbums } from "~/types/AlbumLastFm";
import useGetTopTags from "./useGetTopTags";
import getTopGenre from "~/utils/getTopGenre";

const useGetAlbums = async (
  userName: string,
  timeFrame: string,
  key: string
) => {
  // const topTopStore = useTopTopStore();
  // const { albums, number1, grid } = storeToRefs(topTopStore);
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  let albums = [];
  let number1 = [];
  let grid = [];
  let genres: string[] = [""];
  let topGenre: string;
  try {
    const data: TopAlbums = await $fetch(
      apiBase +
        "method=user.gettopalbums&user=" +
        userName +
        "&period=" +
        timeFrame +
        "&api_key=" +
        key +
        "&format=json "
    );
    for (let i = 1; i < 5; i++) {
      albums.push({
        album: data.topalbums.album[i].name,
        artist: data.topalbums.album[i].artist.name,
        count: data.topalbums.album[i].playcount,
        image: data.topalbums.album[i].image[3],
      });
    }
    for (let i = 0; i < 9; i++) {
      let albumGenres = await useGetTopTags(data.topalbums.album[i], key);
      genres = genres.concat(albumGenres);
      if (i === 0) {
        number1.push({
          album: data.topalbums.album[i].name,
          artist: data.topalbums.album[i].artist.name,
          count: data.topalbums.album[i].playcount,
          image: data.topalbums.album[i].image[3],
        });
      } else if (i > 0 && i < 9) {
        grid.push(data.topalbums.album[i].image[3]);
      }
    }
    topGenre = getTopGenre(genres);
    return { albums: albums, grid: grid, number1: number1, topGenre: topGenre };
    // return { data };
  } catch (err) {
    console.log(err);
  }
};

export default useGetAlbums;
