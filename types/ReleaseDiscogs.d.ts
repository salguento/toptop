// types/discogs.d.ts
export interface Release {
  id: number;
  title: string;
  artists?: Artist[];
  labels?: Label[];
  formats?: Format[];
  genres?: string[];
  styles?: string[];
  year?: number;
  tracklist?: Track[];
  images?: Image[];
  videos?: Video[];
  extraartists?: Artist[];
  country?: string;
  notes?: string;
  master_id?: number;
  master_url?: string;
  uri?: string;
  communities?: Community[];
  date_added?: string;
  date_changed?: string;
  estimated_weight?: number;
  blocked_from_sale?: boolean;
  status?: string;
}

interface Artist {
  id: number;
  name: string;
  anv?: string;
  join?: string;
  role?: string;
  tracks?: string;
  resource_url?: string;
}

interface Label {
  id: number;
  name: string;
  catno?: string;
  entity_type?: string;
  entity_type_name?: string;
  resource_url?: string;
}

interface Format {
  name: string;
  qty: string;
  descriptions?: string[];
  text?: string;
}

interface Track {
  position: string;
  title: string;
  duration: string;
  type_?: string;
  extraartists?: Artist[];
}

interface Image {
  type: "primary" | "secondary";
  uri: string;
  resource_url: string;
  uri150: string;
  width: number;
  height: number;
}

interface Video {
  uri: string;
  title: string;
  description: string;
  duration: number;
  embed: boolean;
}

interface Community {
  status: string;
  rating: {
    count: number;
    average: number;
  };
  have: number;
  want: number;
  contributors: Contributor[];
  data_quality: string;
  submitter?: Contributor;
}

interface Contributor {
  username: string;
  resource_url: string;
}
