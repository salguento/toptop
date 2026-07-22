import type { TopAlbums } from "~/types/AlbumLastFm";
import type { Artists } from "~/types/ArtistsLastFm";
import type { TracksLastFm } from "~/types/TracksLastFm";
import type { UserInfo } from "~/types/UserLastFm";

type LastFmPeriod = "7day" | "1month" | "3month" | "6month" | "12month" | "overall";
type LastFmError = { error?: number; message?: string };
type RecentTracksMetadata = {
  recenttracks: {
    "@attr": {
      total: string;
    };
  };
};

const CACHE_MAX_AGE = 60;
const PERIOD_DAYS: Record<Exclude<LastFmPeriod, "overall">, number> = {
  "7day": 7,
  "1month": 30,
  "3month": 90,
  "6month": 180,
  "12month": 365,
};
const VALID_PERIODS = new Set<LastFmPeriod>([
  "7day",
  "1month",
  "3month",
  "6month",
  "12month",
  "overall",
]);

const readQueryString = (value: unknown, field: string, maximum: number) => {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) {
    throw createError({
      statusCode: 400,
      statusMessage: `${field} is invalid`,
    });
  }

  return value.trim();
};

const assertLastFmResponse = <T>(response: T | LastFmError): T => {
  if (
    response &&
    typeof response === "object" &&
    "error" in response &&
    typeof response.error === "number"
  ) {
    throw createError({
      statusCode: response.error === 6 ? 404 : 502,
      statusMessage: response.message || "Last.fm request failed",
    });
  }

  return response as T;
};

const getCacheKey = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event);
  const user = typeof query.user === "string" ? query.user.trim().toLowerCase() : "";
  const period = typeof query.period === "string" ? query.period : "";
  const albumLimit = query.albumLimit === "50" ? "50" : "13";

  return `${encodeURIComponent(user)}-${period}-${albumLimit}`;
};

export default defineCachedEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);
  const user = readQueryString(query.user, "user", 100);
  const period = readQueryString(query.period, "period", 16) as LastFmPeriod;
  const albumLimit = query.albumLimit === "50" ? 50 : 13;

  if (!VALID_PERIODS.has(period)) {
    throw createError({ statusCode: 400, statusMessage: "period is invalid" });
  }
  if (!config.public.apiBase || !config.public.apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "Last.fm integration is not configured",
    });
  }

  const lastFmFetch = <T>(method: string, extraQuery: Record<string, unknown> = {}) =>
    $fetch<T | LastFmError>(config.public.apiBase, {
      query: {
        method,
        user,
        api_key: config.public.apiKey,
        format: "json",
        ...extraQuery,
      },
    });
  const recentTracksRequest =
    period === "overall"
      ? Promise.resolve(null)
      : (() => {
          const to = Math.floor(Date.now() / 1000);
          const from = to - PERIOD_DAYS[period] * 24 * 60 * 60;

          return lastFmFetch<RecentTracksMetadata>("user.getrecenttracks", {
            limit: 1,
            page: 1,
            from,
            to,
          });
        })();

  const [userResponse, tracksResponse, artistsResponse, albumsResponse, recentResponse] =
    await Promise.all([
      lastFmFetch<UserInfo>("user.getinfo"),
      lastFmFetch<TracksLastFm>("user.gettoptracks", {
        period,
        limit: 5,
        page: 1,
      }),
      lastFmFetch<Artists>("user.gettopartists", {
        period,
        limit: 5,
        page: 1,
      }),
      lastFmFetch<TopAlbums>("user.gettopalbums", {
        period,
        limit: albumLimit,
        page: 1,
      }),
      recentTracksRequest,
    ]);
  const userData = assertLastFmResponse<UserInfo>(userResponse);
  const tracksData = assertLastFmResponse<TracksLastFm>(tracksResponse);
  const artistsData = assertLastFmResponse<Artists>(artistsResponse);
  const topAlbums = assertLastFmResponse<TopAlbums>(albumsResponse);
  const recentTracks = recentResponse
    ? assertLastFmResponse<RecentTracksMetadata>(recentResponse)
    : null;
  const overallScrobbleCount = Number(userData.user.playcount) || 0;

  return {
    userData: {
      image: userData.user.image[1]?.["#text"] ?? "",
      overallScrobbleCount,
    },
    topTracks: {
      scrobbleCount:
        period === "overall"
          ? overallScrobbleCount
          : Number(recentTracks?.recenttracks["@attr"].total) || 0,
      tracks: tracksData.toptracks.track.slice(0, 5).map((track) => ({
        track: track.name,
        count: track.playcount,
      })),
    },
    artistData: {
      artists: artistsData.topartists.artist.slice(0, 5).map((artist) => ({
        artist: artist.name,
        count: artist.playcount,
        image: artist.image[3] ?? artist.image.at(-1),
      })),
      totalArtists:
        Number(artistsData.topartists["@attr"].total) ||
        artistsData.topartists.artist.length,
    },
    topAlbums,
  };
}, {
  name: "lastfm-summary",
  getKey: getCacheKey,
  maxAge: CACHE_MAX_AGE,
  swr: false,
});
