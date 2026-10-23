// Keep missing covers self-contained so previews and exported images agree.
export const ARTWORK_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><path fill="#27272a" d="M0 0h300v300H0z"/></svg>',
  );

export const interceptExportResource = (url: string) => {
  try {
    const protocol = new URL(url, window.location.href).protocol;
    if (["https:", "http:", "data:", "blob:"].includes(protocol)) {
      return undefined;
    }
  } catch {
    // Invalid URLs cannot be embedded in the exported image either.
  }

  return ARTWORK_PLACEHOLDER;
};
