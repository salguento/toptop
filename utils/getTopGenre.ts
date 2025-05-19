import type { Genre } from "~/types/TagsLastFm";

const getTopGenre = (data: Genre[]): string => {
  // Step 1: Remove objects with empty name
  const filteredData = data.filter((item) => item.name !== "");

  // Step 2: Sum playcounts for objects with the same name
  const nameMap: Record<string, number> = {};

  filteredData.forEach((item) => {
    const count = parseInt(item.playcount, 10);
    if (nameMap[item.name]) {
      nameMap[item.name] += count;
    } else {
      nameMap[item.name] = count;
    }
  });

  // Step 3: Find the object with the highest playcount
  let maxName = "";
  let maxPlaycount = -Infinity;

  for (const name in nameMap) {
    if (nameMap[name] > maxPlaycount) {
      maxPlaycount = nameMap[name];
      maxName = name;
    }
  }
  // Return the object with the highest playcount (or null if no valid data)
  return maxName.length ? maxName : "";
};

export default getTopGenre;
