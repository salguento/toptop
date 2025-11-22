// composables/useDiscogs.ts
import type { Release } from "~/types/ReleaseDiscogs";
import type { DiscogsSearchResult } from "~/types/SearchResultsDiscogs";
import type { Genre } from "~/types/TagsLastFm";

export const useGetDiscogGenres = () => {
  // console.log("discog start");
  const config = useRuntimeConfig();
  const DISCOGS_KEY = config.public.discogsKey;
  const DISCOGS_SECRET = config.public.discogsSecret;
  let genres: Genre[] = [];

  const fetchAlbumGenres = async (
    title: string,
    artist: string,
    playcount: string,
  ): Promise<Genre[]> => {
    try {
      // console.log(title, artist);
      // First search for the release
      const searchUrl = "https://api.discogs.com/database/search";
      const searchParams = {
        title: title,
        artist: artist,
        type: "release",

        headers: {
          "User-Agent": "TopTop/1.0", //
        },
        key: DISCOGS_KEY,
        secret: DISCOGS_SECRET,
      };

      const searchResults = await $fetch<DiscogsSearchResult>(searchUrl, {
        query: searchParams,
      });
      if (!searchResults.results?.length) {
        throw new Error("No results found");
      }

      // Get the first result's release ID
      const stylesLength = searchResults.results[0].style?.length
        ? searchResults.results[0]?.style?.length
        : 0;

      // // Fetch release details
      // const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;
      // const releaseData = await $fetch<Release>(releaseUrl, {
      //   query: { key: DISCOGS_KEY, secret: DISCOGS_SECRET },
      // });

      if (searchResults.results[0]?.style)
        for (let i = 0; i < stylesLength; i++) {
          genres.push({
            name: searchResults.results[0]?.style[i],
            playcount: playcount,
          });
        }
      return genres.length > 0 ? genres : [{ name: "", playcount: "" }];
    } catch (error) {
      console.error("Error fetching Discogs data:", error);
      return [{ name: "", playcount: "" }];
    }
  };

  return {
    fetchAlbumGenres,
  };
};
