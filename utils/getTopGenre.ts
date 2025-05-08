const getTopGenre = (genres: string[]): string => {
  const filterdGenres = genres
    .filter((genre) => genre.trim() !== "")
    .sort(
      (a, b) =>
        genres.filter((v) => v === a).length -
        genres.filter((v) => v === b).length
    )
    .shift();
  if (filterdGenres) {
    return filterdGenres;
  } else {
    return "Undefined";
  }
};

export default getTopGenre;
