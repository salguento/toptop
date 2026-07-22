export const useGetArtwork = async (artist: string, album: string) => {
  const { artwork } = await $fetch<{ artwork: string | null }>("/api/artwork", {
    query: {
      artist,
      album,
    },
  });

  return artwork;
};
