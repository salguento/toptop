import type { Genre } from "~/types/TagsLastFm";

export const useGetDiscogGenres = () => {
  let genres: Genre[] = [];

  const fetchAlbumGenres = async (
    title: string,
    artist: string,
    playcount: string,
  ): Promise<Genre[]> => {
    try {
      const { styles } = await $fetch<{ styles: string[] }>(
        "/api/discogs/genres",
        {
          query: { title, artist },
        },
      );

      for (const style of styles) {
        genres.push({
          name: style,
          playcount,
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
