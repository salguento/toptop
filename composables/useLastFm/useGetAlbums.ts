import { storeToRefs } from "pinia";
import { useTopTopStore } from "@/stores/TopTopStore";
import type { TopAlbums } from "~/types/AlbumLastFm";
import type { Genre } from "~/types/TagsLastFm";
import useGetTopTags from "./useGetTopTags";
import { useGetDiscogGenres } from "../useDiscogs/useGetDiscogGenres";
import getTopGenre from "~/utils/getTopGenre";

const useGetAlbums = async (
  userName: string,
  timeFrame: string,
  key: string
) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  const { fetchAlbumGenres } = useGetDiscogGenres();
  let albums = [];
  let number1 = [];
  let grid = [];
  let genres: Genre[] = [];
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
    // Get top 5 albuns
    for (let i = 1; i < 5; i++) {
      albums.push({
        album: data.topalbums.album[i].name,
        artist: data.topalbums.album[i].artist.name,
        count: data.topalbums.album[i].playcount,
        image: data.topalbums.album[i].image[3],
      });
    }
    // Get the genres for all 10 albuns
    for (let i = 0; i < 9; i++) {
      let x = data.topalbums.album[i];

      genres = await fetchAlbumGenres(
        x.name.replace(/\([^)]*\)/g, ""),
        x.artist.name,
        x.playcount
      );
      console.log(x.name);
      console.log(genres);
      if (i === 0) {
        number1.push({
          album: data.topalbums.album[i].name,
          artist: data.topalbums.album[i].artist.name,
          count: data.topalbums.album[i].playcount,
          image: data.topalbums.album[i].image[3]["#text"],
        });
      } else if (i > 0) {
        grid.push(data.topalbums.album[i].image[3]);
      }
    }

    topGenre = getTopGenre(genres);
    return { albums: albums, grid: grid, number1: number1, topGenre: topGenre };
  } catch (err) {
    console.log(err);
  }
};

export default useGetAlbums;
