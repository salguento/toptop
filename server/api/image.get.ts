import type { ArtworkFailure } from "~/types/Artwork";

const ALLOWED_IMAGE_HOSTS = new Set([
  "lastfm.freetls.fastly.net",
  "lastfm-img.freetls.fastly.net",
  "cdn-images.dzcdn.net",
  "e-cdns-images.dzcdn.net",
  "cdns-images.dzcdn.net",
]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const pendingImageRequests = new Map<
  string,
  Promise<{ contentType: string; data: ArrayBuffer }>
>();

const validateImageUrl = (value: string) => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid image URL",
    });
  }

  if (url.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Image host is not allowed",
    });
  }

  return url;
};

const normalizeImageUrl = (url: URL) => {
  // Netlify's runtime cannot currently fetch the `lastfm-img` alias reliably,
  // although it serves the same assets as the canonical Last.fm Fastly host.
  if (url.hostname === "lastfm-img.freetls.fastly.net") {
    url.hostname = "lastfm.freetls.fastly.net";
  }

  return url;
};

const fetchImage = async (initialUrl: URL) => {
  let url = initialUrl;
  const startedAt = Date.now();
  let stage = "fetch";
  let upstreamStatus: number | undefined;
  let contentType: string | null = null;

  try {
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
      stage = "fetch";
      upstreamStatus = undefined;
      contentType = null;
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(6000),
      });
      upstreamStatus = response.status;
      contentType = response.headers.get("content-type");

      if (response.status >= 300 && response.status < 400) {
        stage = "redirect";
        const location = response.headers.get("location");
        if (!location || redirect === MAX_REDIRECTS) {
          throw createError({
            statusCode: 502,
            statusMessage: "Unable to follow image redirect",
          });
        }

        url = validateImageUrl(new URL(location, url).toString());
        continue;
      }

      if (!response.ok) {
        throw createError({
          statusCode: 502,
          statusMessage: "Unable to fetch image",
        });
      }

      stage = "content-type";
      contentType = contentType?.split(";")[0] ?? null;
      if (!contentType?.startsWith("image/")) {
        throw createError({
          statusCode: 415,
          statusMessage: "Remote resource is not an image",
        });
      }

      stage = "size";
      const declaredSize = Number(response.headers.get("content-length"));
      if (declaredSize > MAX_IMAGE_SIZE) {
        throw createError({
          statusCode: 413,
          statusMessage: "Image is too large",
        });
      }

      stage = "read-body";
      const data = await response.arrayBuffer();
      stage = "size";
      if (data.byteLength > MAX_IMAGE_SIZE) {
        throw createError({
          statusCode: 413,
          statusMessage: "Image is too large",
        });
      }

      return { contentType, data };
    }

    throw createError({
      statusCode: 502,
      statusMessage: "Unable to fetch image",
    });
  } catch (error) {
    const failure = error as Error & {
      statusCode?: number;
      cause?: { code?: string };
    };
    const diagnostic: ArtworkFailure = {
      stage,
      message: failure.message,
      url: url.toString(),
      statusCode: failure.statusCode ?? 502,
      upstreamStatus,
      contentType,
      code: failure.cause?.code ?? failure.name,
      durationMs: Date.now() - startedAt,
    };
    console.warn("[Toptop artwork] Server image request failed", diagnostic);
    throw createError({
      statusCode: diagnostic.statusCode,
      statusMessage: "Unable to fetch image",
      data: diagnostic,
    });
  }
};

const fetchImageOnce = (url: URL) => {
  const key = url.toString();
  const pendingRequest = pendingImageRequests.get(key);
  if (pendingRequest) return pendingRequest;

  const request = fetchImage(url).finally(() => {
    pendingImageRequests.delete(key);
  });
  pendingImageRequests.set(key, request);
  return request;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const imageUrl = query.url;

  if (typeof imageUrl !== "string" || !imageUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: "Image URL is required",
    });
  }

  const url = normalizeImageUrl(validateImageUrl(imageUrl));
  let image: Awaited<ReturnType<typeof fetchImageOnce>>;
  try {
    image = await fetchImageOnce(url);
  } catch (error) {
    // A missing cover is an expected result during artwork discovery. Return
    // data rather than an HTTP error so the client can try another provider.
    if (query.format === "data") {
      setResponseHeader(event, "Cache-Control", "no-store");
      return {
        artwork: null,
        error: (error as { data?: ArtworkFailure }).data,
      };
    }
    throw error;
  }

  const { contentType, data } = image;

  if (query.format === "data") {
    setResponseHeader(event, "Cache-Control", "private, max-age=86400");
    return {
      artwork: `data:${contentType};base64,${Buffer.from(data).toString("base64")}`,
    };
  }

  setResponseHeader(event, "Content-Type", contentType);
  setResponseHeader(
    event,
    "Cache-Control",
    "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
  );
  return new Uint8Array(data);
});
