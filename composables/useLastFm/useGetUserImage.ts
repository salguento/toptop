import type { UserInfo } from "~/types/UserLastFm";

import LastFmErrorCheck from "~/utils/LastFmErrorCheck";
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
    return data.user.image[1]?.["#text"];
  } catch (err: any) {
    LastFmErrorCheck(err.response._data.error, userName);
    console.error(err);
    throw err;
  }
};

export default useGetUserImage;
