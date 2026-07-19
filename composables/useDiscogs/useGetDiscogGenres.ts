import type { Genre } from "~/types/TagsLastFm";

export const useGetDiscogGenres = () => {
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

      return styles.map((style) => ({
        name: style,
        playcount,
      }));
    } catch (error) {
      console.error("Error fetching Discogs data:", error);
      return [];
    }
  };

  return {
    fetchAlbumGenres,
  };
};
