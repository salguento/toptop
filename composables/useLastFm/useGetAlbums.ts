import type { TopAlbums } from "~/types/AlbumLastFm";
import type { Genre } from "~/types/TagsLastFm";
import { useGetDiscogGenres } from "../useDiscogs/useGetDiscogGenres";
import getTopGenre from "~/utils/getTopGenre";
import { useGetArtwork } from "../useDeezer/useGetArtwork";
import { ARTWORK_PLACEHOLDER } from "~/utils/artwork";

const TARGET_ALBUM_COUNT = 13;
const ALBUMS_PER_PAGE = 50;
const REQUEST_CONCURRENCY = 3;
const ARTWORK_LOAD_TIMEOUT = 8000;

type LastFmAlbum = TopAlbums["topalbums"]["album"][number];

type AlbumWithArtwork = {
  album: LastFmAlbum;
  artwork: string;
};

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

    image.crossOrigin = "anonymous";
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    timeoutId = setTimeout(() => finish(false), ARTWORK_LOAD_TIMEOUT);
    image.src = artwork;
  });
};

const loadArtwork = async (url: string) => {
  if (!url) return "";

  try {
    const { artwork } = await $fetch<{ artwork: string | null }>("/api/image", {
      query: { url, format: "data" },
      timeout: ARTWORK_LOAD_TIMEOUT,
      retry: 0,
    });
    // Validate the returned bytes without requesting the remote URL again.
    return artwork && (await isArtworkAvailable(artwork)) ? artwork : "";
  } catch {
    return "";
  }
};

const useGetAlbums = async (
  userName: string,
  timeFrame: string,
  key: string,
  hideMissingArtwork = false,
  initialPage?: TopAlbums,
) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const { fetchAlbumGenres } = useGetDiscogGenres();
  const selectedAlbums: AlbumWithArtwork[] = [];

  const fetchPage = (page: number) => {
    if (page === 1 && initialPage) return Promise.resolve(initialPage);

    return $fetch<TopAlbums>(apiBase, {
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
  };

  const resolveArtwork = async (
    album: LastFmAlbum,
  ): Promise<AlbumWithArtwork> => {
    const cleanArtist = album.artist.name.replace(/\([^)]*\)/g, "");
    const cleanAlbum = album.name.replace(/\([^)]*\)/g, "");
    let artwork = await loadArtwork(
      album.image[3]?.["#text"] ?? album.image.at(-1)?.["#text"] ?? "",
    );

    if (!artwork) {
      try {
        artwork = await loadArtwork(
          (await useGetArtwork(cleanArtist, cleanAlbum)) ?? "",
        );
      } catch {
        artwork = "";
      }
    }

    return { album, artwork };
  };

  let page = 1;
  let totalPages = 1;
  let totalAlbumCount = 0;

  while (
    selectedAlbums.length < TARGET_ALBUM_COUNT &&
    page <= totalPages
  ) {
    const data = await fetchPage(page);
    totalPages = Number(data.topalbums["@attr"].totalPages) || 1;
    if (page === 1) {
      totalAlbumCount =
        Number(data.topalbums["@attr"].total) || data.topalbums.album.length;
    }
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
  const albumGenres = await fetchAlbumGenres(
    chosenAlbums.map(({ album }) => ({
      title: album.name.replace(/\([^)]*\)/g, ""),
      artist: album.artist.name,
      playcount: album.playcount,
    })),
  );
  const processedAlbums: Array<AlbumWithArtwork & { genres: Genre[] }> =
    chosenAlbums.map(({ album, artwork }, index) => ({
      album,
      artwork,
      genres: albumGenres[index] ?? [],
    }));

  const toDisplayAlbum = ({ album, artwork }: AlbumWithArtwork) => ({
    album: album.name,
    artist: album.artist.name,
    count: album.playcount,
    image: artwork || ARTWORK_PLACEHOLDER,
  });

  return {
    artworkCount: processedAlbums.length,
    totalAlbums: totalAlbumCount,
    albums: processedAlbums.slice(1, 5).map(toDisplayAlbum),
    grid: processedAlbums
      .slice(1)
      .map(({ artwork }) => artwork || ARTWORK_PLACEHOLDER),
    number1: processedAlbums.slice(0, 1).map(toDisplayAlbum),
    paletteAlbums: processedAlbums.slice(0, 5).map(toDisplayAlbum),
    topGenre: getTopGenre(
      processedAlbums.flatMap((album) => album.genres),
    ),
  };
};

export default useGetAlbums;
