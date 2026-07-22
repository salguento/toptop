import type { TracksLastFm } from "~/types/TracksLastFm";

type TopTracksResult = {
  scrobbleCount: number;
  tracks: Array<{
    track: string;
    count: string;
  }>;
};

const TRACKS_PER_PAGE = 1000;
const REQUEST_CONCURRENCY = 3;

const useGetTracks = async (
  userName: string,
  timeFrame: string,
  key: string,
): Promise<TopTracksResult> => {
  const config = useRuntimeConfig();
  const apiBaseURL = config.public.apiBase;
  const fetchPage = (page: number) =>
    $fetch<TracksLastFm>(apiBaseURL, {
      query: {
        method: "user.gettoptracks",
        user: userName,
        period: timeFrame,
        api_key: key,
        format: "json",
        limit: TRACKS_PER_PAGE,
        page,
      },
    });

  const firstPage = await fetchPage(1);
  const totalPages = Number(firstPage.toptracks["@attr"].totalPages) || 1;
  const allTracks = [...firstPage.toptracks.track];

  for (let page = 2; page <= totalPages; page += REQUEST_CONCURRENCY) {
    const pages = Array.from(
      { length: Math.min(REQUEST_CONCURRENCY, totalPages - page + 1) },
      (_, index) => page + index,
    );
    const responses = await Promise.all(pages.map(fetchPage));

    responses.forEach((response) => {
      allTracks.push(...response.toptracks.track);
    });
  }

  const scrobbleCount = allTracks.reduce(
    (total, track) => total + (Number(track.playcount) || 0),
    0,
  );

  return {
    scrobbleCount,
    tracks: firstPage.toptracks.track.slice(0, 5).map((track) => ({
      track: track.name,
      count: track.playcount,
    })),
  };
};

export default useGetTracks;
