import type { Artists } from "~/types/ArtistsLastFm";

const useGetArtists = async (
  userName: string,
  timeFrame: string,
  key: string,
) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const data: Artists = await $fetch(
    apiBase +
      "method=user.gettopartists&user=" +
      userName +
      "&period=" +
      timeFrame +
      "&api_key=" +
      key +
      "&format=json ",
  );

  return data.topartists.artist.slice(0, 5).map((artist) => ({
    artist: artist.name,
    count: artist.playcount,
    image: artist.image[3] ?? artist.image.at(-1),
  }));
};

export default useGetArtists;
