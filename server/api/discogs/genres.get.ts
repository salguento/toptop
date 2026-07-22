type DiscogsSearchResponse = {
  results?: Array<{
    style?: string[];
  }>;
};

const CACHE_MAX_AGE = 60 * 60 * 24 * 30;
const CACHE_STALE_MAX_AGE = 60 * 60 * 24 * 7;

const normalizeCacheValue = (value: unknown) =>
  typeof value === "string"
    ? value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()
    : "invalid";

const hashCacheKey = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

const getDiscogsCacheKey = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event);
  const title = normalizeCacheValue(query.title);
  const artist = normalizeCacheValue(query.artist);

  return `discogs-${hashCacheKey(`${artist}\u0000${title}`)}`;
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

export default defineCachedEventHandler(async (event) => {
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
          page: 1,
          per_page: 1,
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
}, {
  name: "discogs-genres",
  getKey: getDiscogsCacheKey,
  maxAge: CACHE_MAX_AGE,
  swr: true,
  staleMaxAge: CACHE_STALE_MAX_AGE,
});
