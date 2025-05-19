import type { TagsLastFm, Genre } from "~/types/TagsLastFm";
import type { Album } from "~/types/AlbumLastFm";
import genreList from "~/static/genreDictionary.json";

const useGetTopTags = async (album: Album, key: string): Promise<Genre[]> => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  let genres: Genre[] = [];
  try {
    const data: TagsLastFm = await $fetch(
      apiBase +
        "method=album.gettoptags&artist=" +
        album.artist["name"] +
        "&album=" +
        album.name +
        "&api_key=" +
        key +
        "&format=json "
    );
    for (let i = 0; i < 5; i++) {
      if (genreList.genres.indexOf(data.toptags.tag[i].name) > -1) {
        genres.push({
          name: data.toptags.tag[i].name,
          playcount: album.playcount,
        });
      }
    }
    return genres.length > 0 ? genres : [{ name: "", playcount: "" }];
  } catch (err) {
    return [{ name: "", playcount: "" }];
  }
};

export default useGetTopTags;
