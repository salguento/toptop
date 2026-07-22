const MAX_ALBUMS = 13;
const REQUEST_CONCURRENCY = 3;

type AlbumRequest = {
  title?: unknown;
  artist?: unknown;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<{ albums?: AlbumRequest[] }>(event);

  if (
    !Array.isArray(body?.albums) ||
    body.albums.length === 0 ||
    body.albums.length > MAX_ALBUMS
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: `albums must contain between 1 and ${MAX_ALBUMS} items`,
    });
  }

  const albums = body.albums.map(({ title, artist }) => ({
    title: readDiscogsQuery(title, "title"),
    artist: readDiscogsQuery(artist, "artist"),
  }));
  const styles: string[][] = Array.from({ length: albums.length }, () => []);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < albums.length) {
      const index = nextIndex++;
      const album = albums[index];

      try {
        styles[index] = await fetchDiscogsStyles(
          event,
          album.title,
          album.artist,
        );
      } catch (error) {
        console.error("Failed to fetch Discogs genres:", error);
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(REQUEST_CONCURRENCY, albums.length) },
      worker,
    ),
  );

  return { styles };
});
