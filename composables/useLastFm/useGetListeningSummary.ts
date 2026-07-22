import type { TopAlbums } from "~/types/AlbumLastFm";

type LastFmPeriod = "7day" | "1month" | "3month" | "6month" | "12month" | "overall";

type ListeningSummary = {
  userData: {
    image: string;
    overallScrobbleCount: number;
  };
  topTracks: {
    scrobbleCount: number;
    tracks: Array<{ track: string; count: string }>;
  };
  artistData: {
    artists: Array<{
      artist: string;
      count: string;
      image: { "#text": string; size: string } | undefined;
    }>;
    totalArtists: number;
  };
  topAlbums: TopAlbums;
};

const useGetListeningSummary = (
  user: string,
  period: LastFmPeriod,
  hideMissingArtwork: boolean,
) =>
  $fetch<ListeningSummary>("/api/lastfm/summary", {
    query: {
      user,
      period,
      albumLimit: hideMissingArtwork ? 50 : 13,
    },
  });

export default useGetListeningSummary;
