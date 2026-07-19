import type { TracksLastFm } from "~/types/TracksLastFm";

const useGetTracks = async (
  userName: string,
  timeFrame: string,
  key: string
): Promise<{} | undefined> => {
  const config = useRuntimeConfig();
  const apiBaseURL = config.public.apiBase;
  let trackCount: string;
  let tracks: { track: string; count: string }[] = [];
  try {
    const data: TracksLastFm = await $fetch(
      apiBaseURL +
        "method=user.gettoptracks&user=" +
        userName +
        "&period=" +
        timeFrame +
        "&api_key=" +
        key +
        "&format=json "
    );
    trackCount = data.toptracks["@attr"].total;
    for (let i = 0; i < 5; i++) {
      tracks.push({
        track: data.toptracks.track[i].name,
        count: data.toptracks.track[i].playcount,
      });
    }
    return { trackCount: trackCount, tracks: tracks };
  } catch (err) {
    throw err;
  }
};

export default useGetTracks;
