export type ArtworkFailure = {
  stage: string;
  message: string;
  url: string;
  statusCode?: number;
  upstreamStatus?: number;
  contentType?: string | null;
  code?: string;
  durationMs?: number;
  attempts?: ArtworkFailure[];
};

export type ArtworkResponse = {
  artwork: string | null;
  error?: ArtworkFailure;
  attempts?: ArtworkFailure[];
  resolvedUrl?: string;
};
