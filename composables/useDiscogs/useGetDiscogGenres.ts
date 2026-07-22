import type { Genre } from "~/types/TagsLastFm";

export const useGetDiscogGenres = () => {
  const fetchAlbumGenres = async (
    albums: Array<{ title: string; artist: string; playcount: string }>,
  ): Promise<Genre[][]> => {
    try {
      const { styles } = await $fetch<{ styles: string[][] }>(
        "/api/discogs/genres",
        {
          method: "POST",
          body: {
            albums: albums.map(({ title, artist }) => ({ title, artist })),
          },
        },
      );

      return albums.map(({ playcount }, index) =>
        (styles[index] ?? []).map((style) => ({
          name: style,
          playcount,
        })),
      );
    } catch (error) {
      console.error("Error fetching Discogs data:", error);
      return albums.map(() => []);
    }
  };

  return {
    fetchAlbumGenres,
  };
};
