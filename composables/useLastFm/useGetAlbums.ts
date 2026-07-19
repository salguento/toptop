import type { TopAlbums } from "~/types/AlbumLastFm";
import type { Genre } from "~/types/TagsLastFm";
import { useGetDiscogGenres } from "../useDiscogs/useGetDiscogGenres";
import getTopGenre from "~/utils/getTopGenre";
import { useGetArtwork } from "../useDeezer/useGetArtwork";

const DISCOGS_CONCURRENCY = 3;

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
  const processedAlbums: Array<{
    album: (typeof topAlbums)[number];
    artwork: string;
    genres: Genre[];
  }> = [];

  for (let index = 0; index < topAlbums.length; index += DISCOGS_CONCURRENCY) {
    const batch = await Promise.all(
      topAlbums
        .slice(index, index + DISCOGS_CONCURRENCY)
        .map(async (album) => {
          const cleanArtist = album.artist.name.replace(/\([^)]*\)/g, "");
          const cleanAlbum = album.name.replace(/\([^)]*\)/g, "");
          let artwork =
            album.image[3]?.["#text"] ?? album.image.at(-1)?.["#text"] ?? "";

          if (!artwork) {
            artwork = (await useGetArtwork(cleanArtist, cleanAlbum)) ?? "";
          }

          const albumGenres = await fetchAlbumGenres(
            cleanAlbum,
            album.artist.name,
            album.playcount,
          );

          return {
            album,
            artwork,
            genres: albumGenres,
          };
        }),
    );

    processedAlbums.push(...batch);
  }

  const number1 = processedAlbums.slice(0, 1).map(({ album, artwork }) => ({
    album: album.name,
    artist: album.artist.name,
    count: album.playcount,
    image: artwork,
  }));
  const grid = processedAlbums.slice(1).map(({ artwork }) => artwork);
  const genres = processedAlbums.flatMap((album) => album.genres);

  return {
    albums,
    grid,
    number1,
    topGenre: getTopGenre(genres),
  };
};

export default useGetAlbums;
