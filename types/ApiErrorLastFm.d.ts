export interface LastFmApiError {
  error: LastFmErrorCode;
  message: string;
  errorDetail?: string;
  links?: {
    href: string;
    rel: string;
    text: string;
  };
}
