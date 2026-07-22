import type { TracksLastFm } from "~/types/TracksLastFm";

type LastFmPeriod = "7day" | "1month" | "3month" | "6month" | "12month" | "overall";

type RecentTracksMetadata = {
  recenttracks: {
    "@attr": {
      total: string;
    };
  };
};

type TopTracksResult = {
  scrobbleCount: number | null;
  tracks: Array<{
    track: string;
    count: string;
  }>;
};

const PERIOD_DAYS: Record<Exclude<LastFmPeriod, "overall">, number> = {
  "7day": 7,
  "1month": 30,
  "3month": 90,
  "6month": 180,
  "12month": 365,
};

const useGetTracks = async (
  userName: string,
  timeFrame: LastFmPeriod,
  key: string,
): Promise<TopTracksResult> => {
  const config = useRuntimeConfig();
  const apiBaseURL = config.public.apiBase;
  const topTracksRequest = $fetch<TracksLastFm>(apiBaseURL, {
    query: {
      method: "user.gettoptracks",
      user: userName,
      period: timeFrame,
      api_key: key,
      format: "json",
      limit: 5,
      page: 1,
    },
  });

  const scrobbleCountRequest =
    timeFrame === "overall"
      ? Promise.resolve(null)
      : (() => {
          const to = Math.floor(Date.now() / 1000);
          const from = to - PERIOD_DAYS[timeFrame] * 24 * 60 * 60;

          return $fetch<RecentTracksMetadata>(apiBaseURL, {
            query: {
              method: "user.getrecenttracks",
              user: userName,
              api_key: key,
              format: "json",
              limit: 1,
              page: 1,
              from,
              to,
            },
          }).then((data) => Number(data.recenttracks["@attr"].total) || 0);
        })();

  const [topTracks, scrobbleCount] = await Promise.all([
    topTracksRequest,
    scrobbleCountRequest,
  ]);

  return {
    scrobbleCount,
    tracks: topTracks.toptracks.track.slice(0, 5).map((track) => ({
      track: track.name,
      count: track.playcount,
    })),
  };
};

export default useGetTracks;
