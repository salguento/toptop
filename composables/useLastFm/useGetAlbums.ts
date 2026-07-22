import type { TopAlbums } from "~/types/AlbumLastFm";
import type { Genre } from "~/types/TagsLastFm";
import { useGetDiscogGenres } from "../useDiscogs/useGetDiscogGenres";
import getTopGenre from "~/utils/getTopGenre";
import { useGetArtwork } from "../useDeezer/useGetArtwork";

const TARGET_ALBUM_COUNT = 13;
const ALBUMS_PER_PAGE = 50;
const REQUEST_CONCURRENCY = 3;
const ARTWORK_LOAD_TIMEOUT = 8000;

type LastFmAlbum = TopAlbums["topalbums"]["album"][number];

type AlbumWithArtwork = {
  album: LastFmAlbum;
  artwork: string;
};

const getArtworkProxyUrl = (artwork: string) =>
  `/api/image?url=${encodeURIComponent(artwork)}`;

const isArtworkAvailable = (artwork: string) => {
  if (!artwork) return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    const image = new Image();
    let timeoutId: ReturnType<typeof setTimeout>;

    const finish = (available: boolean) => {
      image.onload = null;
      image.onerror = null;
      clearTimeout(timeoutId);
      resolve(available);
    };

    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    timeoutId = setTimeout(() => finish(false), ARTWORK_LOAD_TIMEOUT);
    image.src = getArtworkProxyUrl(artwork);
  });
};

const useGetAlbums = async (
  userName: string,
  timeFrame: string,
  key: string,
  hideMissingArtwork = false,
) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const { fetchAlbumGenres } = useGetDiscogGenres();
  const selectedAlbums: AlbumWithArtwork[] = [];

  const fetchPage = (page: number) =>
    $fetch<TopAlbums>(apiBase, {
      query: {
        method: "user.gettopalbums",
        user: userName,
        period: timeFrame,
        api_key: key,
        format: "json",
        limit: hideMissingArtwork ? ALBUMS_PER_PAGE : TARGET_ALBUM_COUNT,
        page,
      },
    });

  const resolveArtwork = async (
    album: LastFmAlbum,
  ): Promise<AlbumWithArtwork> => {
    const cleanArtist = album.artist.name.replace(/\([^)]*\)/g, "");
    const cleanAlbum = album.name.replace(/\([^)]*\)/g, "");
    let artwork =
      album.image[3]?.["#text"] ?? album.image.at(-1)?.["#text"] ?? "";
    let artworkWasValidated = false;

    if (hideMissingArtwork && artwork) {
      artworkWasValidated = await isArtworkAvailable(artwork);
      if (!artworkWasValidated) artwork = "";
    }

    if (!artwork) {
      try {
        artwork = (await useGetArtwork(cleanArtist, cleanAlbum)) ?? "";
      } catch {
        artwork = "";
      }
    }

    if (
      hideMissingArtwork &&
      artwork &&
      !artworkWasValidated &&
      !(await isArtworkAvailable(artwork))
    ) {
      artwork = "";
    }

    return { album, artwork };
  };

  let page = 1;
  let totalPages = 1;

  while (
    selectedAlbums.length < TARGET_ALBUM_COUNT &&
    page <= totalPages
  ) {
    const data = await fetchPage(page);
    totalPages = Number(data.topalbums["@attr"].totalPages) || 1;
    const candidates = hideMissingArtwork
      ? data.topalbums.album
      : data.topalbums.album.slice(0, TARGET_ALBUM_COUNT);

    for (
      let index = 0;
      index < candidates.length &&
      selectedAlbums.length < TARGET_ALBUM_COUNT;
      index += REQUEST_CONCURRENCY
    ) {
      const batch = await Promise.all(
        candidates
          .slice(index, index + REQUEST_CONCURRENCY)
          .map(resolveArtwork),
      );

      selectedAlbums.push(
        ...batch.filter(({ artwork }) => !hideMissingArtwork || artwork),
      );
    }

    if (!hideMissingArtwork) break;
    page += 1;
  }

  const chosenAlbums = selectedAlbums.slice(0, TARGET_ALBUM_COUNT);
  const processedAlbums: Array<AlbumWithArtwork & { genres: Genre[] }> = [];

  for (
    let index = 0;
    index < chosenAlbums.length;
    index += REQUEST_CONCURRENCY
  ) {
    const batch = await Promise.all(
      chosenAlbums
        .slice(index, index + REQUEST_CONCURRENCY)
        .map(async ({ album, artwork }) => ({
          album,
          artwork,
          genres: await fetchAlbumGenres(
            album.name.replace(/\([^)]*\)/g, ""),
            album.artist.name,
            album.playcount,
          ),
        })),
    );

    processedAlbums.push(...batch);
  }

  const toDisplayAlbum = ({ album, artwork }: AlbumWithArtwork) => ({
    album: album.name,
    artist: album.artist.name,
    count: album.playcount,
    image: artwork,
  });

  return {
    artworkCount: processedAlbums.length,
    albums: processedAlbums.slice(1, 5).map(toDisplayAlbum),
    grid: processedAlbums.slice(1).map(({ artwork }) => artwork),
    number1: processedAlbums.slice(0, 1).map(toDisplayAlbum),
    paletteAlbums: processedAlbums.slice(0, 5).map(toDisplayAlbum),
    topGenre: getTopGenre(
      processedAlbums.flatMap((album) => album.genres),
    ),
  };
};

export default useGetAlbums;
