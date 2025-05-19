export interface DiscogsSearchResult {
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
    urls?: {
      last?: string;
      next?: string;
    };
  };
  results: Array<{
    id: number;
    type: "release" | "master" | "artist" | "label";
    title: string;
    cover_image?: string;
    thumb?: string;
    country?: string;
    year?: number;
    format?: string[];
    label?: string[];
    genre?: string[];
    style?: string[];
    barcode?: string[];
    catno?: string;
    uri?: string;
    community?: {
      want: number;
      have: number;
    };
    resource_url?: string;
    user_data?: {
      in_collection: boolean;
      in_wantlist: boolean;
    };

    // Artist-specific fields (if type="artist")
    anv?: string;
    join?: string;
    role?: string;

    // Label-specific fields (if type="label")
    label_id?: number;

    // Master release fields (if type="master")
    master_id?: number;
    master_url?: string;
  }>;
}
