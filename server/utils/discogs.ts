import type { H3Event } from "h3";

type DiscogsSearchResponse = {
  results?: Array<{
    style?: string[];
  }>;
};

const CACHE_MAX_AGE = 60 * 60 * 24 * 30;
const CACHE_STALE_MAX_AGE = 60 * 60 * 24 * 7;

const normalizeCacheValue = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

const hashCacheKey = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

export const readDiscogsQuery = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim() || value.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: `${field} must be a non-empty string up to 200 characters`,
    });
  }

  return value.trim();
};

export const fetchDiscogsStyles = defineCachedFunction(
  async (event: H3Event, title: string, artist: string) => {
    const config = useRuntimeConfig(event);

    if (!config.discogsKey || !config.discogsSecret) {
      throw createError({
        statusCode: 503,
        statusMessage: "Discogs integration is not configured",
      });
    }

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

    return response.results?.[0]?.style ?? [];
  },
  {
    name: "discogs-genres",
    getKey: (_event, title, artist) =>
      hashCacheKey(
        `${normalizeCacheValue(artist)}\u0000${normalizeCacheValue(title)}`,
      ),
    maxAge: CACHE_MAX_AGE,
    swr: true,
    staleMaxAge: CACHE_STALE_MAX_AGE,
  },
);
