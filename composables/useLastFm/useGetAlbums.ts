import type { TopAlbums } from "~/types/AlbumLastFm";
import type { Genre } from "~/types/TagsLastFm";
import { useGetDiscogGenres } from "../useDiscogs/useGetDiscogGenres";
import getTopGenre from "~/utils/getTopGenre";
import { useGetArtwork } from "../useDeezer/useGetArtwork";

const useGetAlbums = async (
  userName: string,
  timeFrame: string,
  key: string,
) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const { fetchAlbumGenres } = useGetDiscogGenres();

  const data: TopAlbums = await $fetch(
    apiBase +
      "method=user.gettopalbums&user=" +
      userName +
      "&period=" +
      timeFrame +
      "&api_key=" +
      key +
      "&format=json ",
  );

  const topAlbums = data.topalbums.album.slice(0, 13);
  const albums = topAlbums.slice(1, 5).map((album) => ({
    album: album.name,
    artist: album.artist.name,
    count: album.playcount,
    image: album.image[3] ?? album.image.at(-1),
  }));
  const number1 = [];
  const grid = [];
  let genres: Genre[] = [];

  for (const [index, album] of topAlbums.entries()) {
    const cleanArtist = album.artist.name.replace(/\([^)]*\)/g, "");
    const cleanAlbum = album.name.replace(/\([^)]*\)/g, "");
    let artwork =
      album.image[3]?.["#text"] ?? album.image.at(-1)?.["#text"] ?? "";

    if (!artwork) {
      artwork = (await useGetArtwork(cleanArtist, cleanAlbum)) ?? "";
    }

    genres = await fetchAlbumGenres(
      cleanAlbum,
      album.artist.name,
      album.playcount,
    );

    if (index === 0) {
      number1.push({
        album: album.name,
        artist: album.artist.name,
        count: album.playcount,
        image: artwork,
      });
    } else {
      grid.push(artwork);
    }
  }

  return {
    albums,
    grid,
    number1,
    topGenre: getTopGenre(genres),
  };
};

export default useGetAlbums;
