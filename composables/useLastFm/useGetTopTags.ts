import type { TagsLastFm } from "~/types/TagsLastFm";
import type { Album } from "~/types/AlbumLastFm";
import genreList from "~/static/genreDictionary.json";

const useGetTopTags = async (album: Album, key: string): Promise<string[]> => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  let genres: string[] = [];
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
        genres.push(data.toptags.tag[i].name);
      }
    }
    return genres.length > 0 ? genres : [""];
  } catch (err) {
    return [""];
  }
};

export default useGetTopTags;
