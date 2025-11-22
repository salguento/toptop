export const useGetArtwork = async (artist: string, album: string) => {
  const artwork = await $fetch("/api/artwork", {
    key: `artwork-${artist}-${album}`,
    query: {
      artist,
      album,
    },
    server: false, // Fetch on client side if you want
  });

  const coverUrl = computed(() => {
    if (artwork && artwork.data && artwork.data[0]) {
      return artwork.data[0].album.cover_big;
    }
    return null;
  });
  return coverUrl.value;
};
