import useGetAccountCreationDate from "./useGetAccountCreationDate";

const useGetListeningStats = async (
  username: string,
  key: string,
  timeframe: string,
) => {
  const baseUrl = "https://ws.audioscrobbler.com/2.0/";
  const allTracks = [];
  let page = 1;
  let totalPages = 1;
  let to = Math.floor(Date.now() / 1000);
  let from = new Date();
  let now = new Date();
  let fromUnix;
  let accountCreationDate: number;

  switch (true) {
    case timeframe === "Weekly":
      from.setDate(now.getDate() - 7);
      fromUnix = Math.floor(from.getTime() / 1000);
      break;
    case timeframe == "Monthly":
      from.setDate(now.getDate() - 30);
      fromUnix = Math.floor(from.getTime() / 1000);
      break;
    case timeframe == "Quarterly":
      from.setDate(now.getDate() - 91);
      fromUnix = Math.floor(from.getTime() / 1000);
      break;
    case timeframe == "Biannually":
      from.setDate(now.getDate() - 182);
      fromUnix = Math.floor(from.getTime() / 1000);
      break;
    case timeframe == "Yearly":
      from.setDate(now.getDate() - 365);
      fromUnix = Math.floor(from.getTime() / 1000);
      break;
    case timeframe == "Overall":
      accountCreationDate =
        (await useGetAccountCreationDate(username, key)) || 0;
      from.setDate(now.getDate() - accountCreationDate);
      fromUnix = Math.floor(from.getTime() / 1000);
      break;
  }

  try {
    // Fetch all pages of recent tracks
    while (page <= totalPages) {
      const params = {
        method: "user.getrecenttracks",
        user: username,
        api_key: key,
        format: "json",
        from: fromUnix?.toString(), // Convert to Unix timestamp
        to: to.toString(),
        limit: "200", // Maximum per page
        page: page.toString(),
      };

      const response = await fetch(
        `${baseUrl}?method=${params.method}&limit=200&user=${params.user}&page=${params.page}&from=${params.from}&to=${params.to}&api_key=${params.api_key}&format=json`,
      );

      // Check if response is OK before parsing
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      // Check if response is empty
      if (!text.trim()) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON:", text);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      if (data.error) {
        throw new Error(`Last.fm API error: ${data.message}`);
      }

      // Check if the expected data structure exists
      if (!data.recenttracks || !data.recenttracks.track) {
        throw new Error("Invalid response structure from Last.fm API");
      }

      const tracks = data.recenttracks.track;
      allTracks.push(...tracks);

      totalPages = parseInt(data.recenttracks["@attr"].totalPages) || 1;
      page++;

      // Rate limiting - be nice to the API
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Calculate unique artists and albums
    const uniqueArtists = new Set();
    const uniqueAlbums = new Set();

    allTracks.forEach((track) => {
      if (track.artist?.["#text"]) {
        uniqueArtists.add(track.artist["#text"].toLowerCase());
      }
      if (track.album?.["#text"]) {
        uniqueAlbums.add(track.album["#text"].toLowerCase());
      }
    });

    console.log({
      uniqueArtists: uniqueArtists.size,
      uniqueAlbums: uniqueAlbums.size,
    });
    return {
      uniqueArtists: uniqueArtists.size,
      uniqueAlbums: uniqueAlbums.size,
    };
  } catch (error) {
    console.error("Error fetching listening stats:", error);
    throw error;
  }
};

export default useGetListeningStats;
