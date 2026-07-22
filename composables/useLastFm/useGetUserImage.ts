import type { UserInfo } from "~/types/UserLastFm";

const useGetUserImage = async (userName: string, key: string) => {
  const config = useRuntimeConfig();
  const apiBaseURL = config.public.apiBase;

  try {
    const data: UserInfo = await $fetch(
      apiBaseURL +
        "method=user.getinfo&user=" +
        userName +
        "&api_key=" +
        key +
        "&format=json ",
    );
    return {
      image: data.user.image[1]?.["#text"] ?? "",
      overallScrobbleCount: Number(data.user.playcount) || 0,
    };
  } catch (err) {
    throw err;
  }
};

export default useGetUserImage;
