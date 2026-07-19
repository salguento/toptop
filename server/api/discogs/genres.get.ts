type DiscogsSearchResponse = {
  results?: Array<{
    style?: string[];
  }>;
};

const readRequiredQuery = (
  value: string | string[] | undefined,
  field: string,
): string => {
  if (typeof value !== "string" || !value.trim() || value.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: `${field} must be a non-empty string up to 200 characters`,
    });
  }

  return value.trim();
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);
  const title = readRequiredQuery(query.title, "title");
  const artist = readRequiredQuery(query.artist, "artist");

  if (!config.discogsKey || !config.discogsSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: "Discogs integration is not configured",
    });
  }

  try {
    const response = await $fetch<DiscogsSearchResponse>(
      "https://api.discogs.com/database/search",
      {
        headers: {
          Authorization: `Discogs key=${config.discogsKey}, secret=${config.discogsSecret}`,
          "User-Agent": "TopTop/1.0",
        },
        query: {
          title,
          artist,
          type: "release",
        },
      },
    );

    return {
      styles: response.results?.[0]?.style ?? [],
    };
  } catch (error) {
    console.error("Failed to fetch Discogs genres:", error);
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch genres from Discogs",
    });
  }
});
