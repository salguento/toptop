// server/api/artwork.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { artist, album } = query;

  if (!artist || !album) {
    throw createError({
      statusCode: 400,
      statusMessage: "Artist and album parameters are required",
    });
  }

  const deezerUrl = `https://api.deezer.com/search?q=artist:"${artist}" album:"${album}"`;

  try {
    const response = await $fetch(deezerUrl);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch artwork from Deezer",
    });
  }
});
