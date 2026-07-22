type DeezerSearchResponse = {
  data?: Array<{
    album?: {
      cover_big?: string;
    };
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

const getArtworkCacheKey = (event: Parameters<typeof getQuery>[0]) => {
  const query = getQuery(event);
  const artist = normalizeCacheValue(query.artist);
  const album = normalizeCacheValue(query.album);

  return `deezer-artwork-${hashCacheKey(`${artist}\u0000${album}`)}`;
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
  const query = getQuery(event);
  const artist = readRequiredQuery(query.artist, "artist");
  const album = readRequiredQuery(query.album, "album");

  try {
    const response = await $fetch<DeezerSearchResponse>(
      "https://api.deezer.com/search",
      {
        query: {
          q: `artist:"${artist}" album:"${album}"`,
          limit: 1,
        },
      },
    );

    return {
      artwork: response.data?.[0]?.album?.cover_big ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch artwork from Deezer:", error);
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch artwork from Deezer",
    });
  }
}, {
  name: "deezer-artwork",
  getKey: getArtworkCacheKey,
  maxAge: CACHE_MAX_AGE,
  swr: true,
  staleMaxAge: CACHE_STALE_MAX_AGE,
});
