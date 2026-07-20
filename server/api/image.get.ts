const ALLOWED_IMAGE_HOSTS = new Set([
  "lastfm.freetls.fastly.net",
  "e-cdns-images.dzcdn.net",
  "cdns-images.dzcdn.net",
]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

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

const fetchImage = async (initialUrl: URL) => {
  let url = initialUrl;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    const response = await fetch(url, { redirect: "manual" });

    if (response.status >= 300 && response.status < 400) {
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

    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (!contentType?.startsWith("image/")) {
      throw createError({
        statusCode: 415,
        statusMessage: "Remote resource is not an image",
      });
    }

    const declaredSize = Number(response.headers.get("content-length"));
    if (declaredSize > MAX_IMAGE_SIZE) {
      throw createError({
        statusCode: 413,
        statusMessage: "Image is too large",
      });
    }

    const data = await response.arrayBuffer();
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
};

export default defineEventHandler(async (event) => {
  const imageUrl = getQuery(event).url;

  if (typeof imageUrl !== "string" || !imageUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: "Image URL is required",
    });
  }

  const { contentType, data } = await fetchImage(validateImageUrl(imageUrl));

  setResponseHeader(event, "Content-Type", contentType);
  setResponseHeader(event, "Cache-Control", "public, max-age=86400");
  return new Uint8Array(data);
});
