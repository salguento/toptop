import type { TopAlbums } from "~/types/AlbumLastFm";
import type { Genre } from "~/types/TagsLastFm";
import { useGetDiscogGenres } from "../useDiscogs/useGetDiscogGenres";
import getTopGenre from "~/utils/getTopGenre";
import { useGetArtwork } from "../useDeezer/useGetArtwork";
import { ARTWORK_PLACEHOLDER } from "~/utils/artwork";
import type { ArtworkResponse } from "~/types/Artwork";

const TARGET_ALBUM_COUNT = 13;
const ALBUMS_PER_PAGE = 50;
const REQUEST_CONCURRENCY = 3;
const ARTWORK_LOAD_TIMEOUT = 8000;

type LastFmAlbum = TopAlbums["topalbums"]["album"][number];

type AlbumWithArtwork = {
  album: LastFmAlbum;
  artwork: string;
};

type ArtworkContext = {
  artist: string;
  album: string;
  provider: "Last.fm" | "Deezer";
};

const isArtworkAvailable = (artwork: string) => {
  return new Promise<"loaded" | "decode-error" | "timeout">((resolve) => {
    const image = new Image();
    let timeoutId: ReturnType<typeof setTimeout>;

    const finish = (result: "loaded" | "decode-error" | "timeout") => {
      image.onload = null;
      image.onerror = null;
      clearTimeout(timeoutId);
      resolve(result);
    };

    image.crossOrigin = "anonymous";
    image.onload = () => finish("loaded");
    image.onerror = () => finish("decode-error");
    timeoutId = setTimeout(() => finish("timeout"), ARTWORK_LOAD_TIMEOUT);
    image.src = artwork;
  });
};

const loadArtwork = async (url: string, context: ArtworkContext) => {
  const startedAt = Date.now();
  if (!url) {
    console.warn("[Toptop artwork] Provider returned no cover URL", context);
    return "";
  }

  try {
    const { artwork, error } = await $fetch<ArtworkResponse>("/api/image", {
      query: { url, format: "data" },
      timeout: ARTWORK_LOAD_TIMEOUT,
      retry: 0,
    });
    if (!artwork) {
      console.warn("[Toptop artwork] Server could not load cover", {
        ...context,
        sourceUrl: url,
        durationMs: Date.now() - startedAt,
        failure: error ?? { stage: "server-response", message: "No artwork or diagnostic returned" },
      });
      return "";
    }
    // Validate the returned bytes without requesting the remote URL again.
    const result = await isArtworkAvailable(artwork);
    const details = {
      ...context,
      sourceUrl: url,
      stage: "browser-decode",
      result,
      durationMs: Date.now() - startedAt,
      dataUrlLength: artwork.length,
    };
    if (result !== "loaded") {
      console.warn("[Toptop artwork] Browser could not decode cover", details);
      return "";
    }
    console.info("[Toptop artwork] Cover loaded", details);
    return artwork;
  } catch (error) {
    const failure = error as Error & { statusCode?: number; data?: unknown };
    console.warn("[Toptop artwork] Image API request failed", {
      ...context,
      sourceUrl: url,
      stage: "image-api",
      durationMs: Date.now() - startedAt,
      message: failure.message,
      statusCode: failure.statusCode,
      failure: failure.data,
    });
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
    const context = { artist: album.artist.name, album: album.name };
    let artwork = await loadArtwork(
      album.image[3]?.["#text"] ?? album.image.at(-1)?.["#text"] ?? "",
      { ...context, provider: "Last.fm" },
    );

    if (!artwork) {
      console.info("[Toptop artwork] Trying Deezer fallback", context);
      try {
        artwork = await loadArtwork(
          (await useGetArtwork(cleanArtist, cleanAlbum)) ?? "",
          { ...context, provider: "Deezer" },
        );
      } catch (error) {
        const failure = error as Error & { statusCode?: number };
        console.warn("[Toptop artwork] Deezer lookup failed", {
          ...context,
          stage: "deezer-search",
          message: failure.message,
          statusCode: failure.statusCode,
        });
        artwork = "";
      }
    }

    if (!artwork) {
      console.warn("[Toptop artwork] No usable cover; album will be " +
        (hideMissingArtwork ? "skipped" : "shown with a placeholder"), context);
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
  console.info("[Toptop artwork] Selected album summary", {
    selected: chosenAlbums.length,
    loaded: chosenAlbums.filter(({ artwork }) => artwork).length,
    placeholders: chosenAlbums.filter(({ artwork }) => !artwork).length,
    hideMissingArtwork,
    albums: chosenAlbums.map(({ album, artwork }, index) => ({
      rank: index + 1,
      artist: album.artist.name,
      album: album.name,
      result: artwork ? "loaded" : "placeholder",
    })),
  });
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
