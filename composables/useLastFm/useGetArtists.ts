import type { Artists } from "~/types/ArtistsLastFm";

const useGetArtists = async (
  userName: string,
  timeFrame: string,
  key: string
) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  let artists = [];
  try {
    const data: Artists = await $fetch(
      apiBase +
        "method=user.gettopartists&user=" +
        userName +
        "&period=" +
        timeFrame +
        "&api_key=" +
        key +
        "&format=json "
    );
    for (let i = 0; i < 5; i++) {
      artists.push({
        artist: data.topartists.artist[i].name,
        count: data.topartists.artist[i].playcount,
        image: data.topartists.artist[i].image[3],
      });
    }
    return artists;
  } catch (err) {
    throw err;
  }
};

export default useGetArtists;
