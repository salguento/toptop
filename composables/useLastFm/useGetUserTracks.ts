import type { TracksLastFm } from "~/types/TracksLastFm";

type TopTracksResult = {
  trackCount: string;
  tracks: Array<{
    track: string;
    count: string;
  }>;
};

const useGetTracks = async (
  userName: string,
  timeFrame: string,
  key: string,
): Promise<TopTracksResult> => {
  const config = useRuntimeConfig();
  const apiBaseURL = config.public.apiBase;
  const data: TracksLastFm = await $fetch(
    apiBaseURL +
      "method=user.gettoptracks&user=" +
      userName +
      "&period=" +
      timeFrame +
      "&api_key=" +
      key +
      "&format=json ",
  );

  return {
    trackCount: data.toptracks["@attr"].total,
    tracks: data.toptracks.track.slice(0, 5).map((track) => ({
      track: track.name,
      count: track.playcount,
    })),
  };
};

export default useGetTracks;
