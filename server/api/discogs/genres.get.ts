export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const title = readDiscogsQuery(query.title, "title");
  const artist = readDiscogsQuery(query.artist, "artist");

  try {
    return {
      styles: await fetchDiscogsStyles(event, title, artist),
    };
  } catch (error) {
    console.error("Failed to fetch Discogs genres:", error);
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch genres from Discogs",
    });
  }
});
