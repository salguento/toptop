<script setup>
const config = useRuntimeConfig();
import { extractColors } from "extract-colors";
import domtoimage from "dom-to-image-more";
import { genreList } from "./genreList.js";

const apiRoot = "https://ws.audioscrobbler.com/2.0/?";
const key = config.public.apiKey;
const user = ref([
  {
    name: "",
    img: "",
  },
]);
const period = ref("7day");
const load = ref(false);
const timespan = ref("");
const g = ref("");

const date = new Date();
const day = date.getDate();
const month = date.getMonth() + 1;
const year = date.getFullYear();
const fullDate = day + "/" + month + "/" + year;

let tracks = [];
let artists = [];
let albums = [];
let number1 = [];
let grid = [];
let genres = [];
let trackCount;
let colors = [];

const uGetInfo = async (u, k) => {
  try {
    const data = await $fetch(
      apiRoot +
        "method=user.getinfo&user=" +
        u +
        "&api_key=" +
        k +
        "&format=json "
    );
    let e = data.user.image[1];
    user.value.img = e["#text"];
  } catch (err) {
    console.log(err);
  }
};

const uGetTracks = async (u, p, k) => {
  try {
    const data = await $fetch(
      apiRoot +
        "method=user.gettoptracks&user=" +
        u +
        "&period=" +
        p +
        "&api_key=" +
        k +
        "&format=json "
    );
    trackCount = data.toptracks["@attr"].total;
    for (let i = 0; i < 5; i++) {
      tracks.push({
        track: data.toptracks.track[i].name,
        count: data.toptracks.track[i].playcount,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

const uGetAlbums = async (u, p, k) => {
  try {
    const data = await $fetch(
      apiRoot +
        "method=user.gettopalbums&user=" +
        u +
        "&period=" +
        p +
        "&api_key=" +
        k +
        "&format=json "
    );
    for (let i = 1; i < 5; i++) {
      albums.push({
        album: data.topalbums.album[i].name,
        artist: data.topalbums.album[i].artist.name,
        count: data.topalbums.album[i].playcount,
        image: data.topalbums.album[i].image[3],
      });
    }
    for (let i = 0; i < 9; i++) {
      await getTopTags(data.topalbums.album[i]);
      if (i === 0) {
        number1.push({
          album: data.topalbums.album[i].name,
          artist: data.topalbums.album[i].artist.name,
          count: data.topalbums.album[i].playcount,
          image: data.topalbums.album[i].image[3],
        });
      } else if (i > 0 && i < 9) {
        grid.push(data.topalbums.album[i].image[3]);
      }
    }
    g.value = mostGenre(genres);
  } catch (err) {
    console.log(err);
  }
};

const getTopTags = async (a) => {
  try {
    const data = await $fetch(
      apiRoot +
        "method=album.gettoptags&artist=" +
        a.artist["name"] +
        "&album=" +
        a.name +
        "&api_key=" +
        key +
        "&format=json "
    );
    // console.log(data.toptags.tag[5].name);
    for (let i = 0; i < 5; i++) {
      if (genreList.indexOf(data.toptags.tag[i].name) > -1) {
        genres.push(data.toptags.tag[i].name);
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const mostGenre = (arr) => {
  return arr
    .sort(
      (a, b) =>
        arr.filter((v) => v === a).length - arr.filter((v) => v === b).length
    )
    .pop();
};

const uGetArtists = async (u, p, k) => {
  try {
    const data = await $fetch(
      apiRoot +
        "method=user.gettopartists&user=" +
        u +
        "&period=" +
        p +
        "&api_key=" +
        k +
        "&format=json "
    );
    for (let i = 0; i < 5; i++) {
      artists.push({
        artist: data.topartists.artist[i].name,
        count: data.topartists.artist[i].playcount,
        image: data.topartists.artist[i].image[3],
      });
    }
  } catch (err) {
    console.log(err);
  }
};

const handleClick = async (u, p, k) => {
  clear();
  await uGetInfo(u, k);
  await uGetTracks(u, p, k);
  await uGetArtists(u, p, k);
  await uGetAlbums(u, p, k);
  await getColors();

  if (tracks.length > 0 && albums.length > 0 && artists.length > 0) {
    setTimespan();
    load.value = true;
    addColors();
    setTimeout(() => print(), 1000);
  }
};

const getColors = async () => {
  let p = 10000;
  let d = 0.2;
  let s = 0.2;
  let l = 0;
  let h = 0.083;
  colors = await extractColors(number1[0].image["#text"], {
    pixels: p,
    distance: d,
    saturationDistance: s,
    lightnessDistance: l,
    hueDistance: h,
  });

  while (colors.length < 8) {
    d -= 0.01;
    colors = await extractColors(number1[0].image["#text"], {
      pixels: p,
      distance: d,
      saturationDistance: s,
      lightnessDistance: l,
      hueDistance: h,
    });
  }
  while (colors.length > 10) {
    d += 0.01;
    colors = await extractColors(number1[0].image["#text"], {
      pixels: p,
      distance: d,
      saturationDistance: s,
      lightnessDistance: l,
      hueDistance: h,
    });
  }
  colors.sort((a, b) => a.lightness - b.lightness);
};

const setTimespan = () => {
  switch (period.value) {
    case "7day":
      timespan.value = "Weekly";
      break;
    case "1month":
      timespan.value = "Monthly";
      break;
    case "3month":
      timespan.value = "Trimestral";
      break;
    case "6month":
      timespan.value = "Semestral";
      break;
    case "12month":
      timespan.value = "Yearly";
      break;
    case "overall":
      timespan.value = "Overall";
      break;
  }
};

const print = () => {
  let node = document.getElementById("canvas");
  domtoimage
    .toPng(node, { copyDefaultStyles: false, height: 1920, width: 1080 })
    .then(function (dataUrl) {
      var img = new Image();
      img.src = dataUrl;
      document.getElementById("print").appendChild(img);
    })
    .catch(function (error) {
      console.error("oops, something went wrong!", error);
    });
};

const clear = () => {
  let print = document.getElementById("print");
  while (print.hasChildNodes()) {
    print.removeChild(print.firstChild);
  }

  load.value = false;
  timespan.value = "";
  g.value = "";

  tracks = [];
  artists = [];
  albums = [];
  number1 = [];
  grid = [];
  genres = [];
  trackCount;
  colors = [];
};

const addColors = () => {
  const b = document.getElementById("background");
  const p = document.getElementById("post");
  const palette = getPalette(colors);
  b.style.backgroundImage =
    "linear-gradient(" + palette.primary + "," + palette.secondary + ")";
  p.style.color = palette.text;
};

const darkHex = (c, i = 0) => {
  c.sort((a, b) => a.lightness - b.lightness);
  return c[i].hex;
};

const lightHex = (c, i = 0) => {
  c.sort((a, b) => b.lightness - a.lightness);
  return c[i].hex;
};

const getPalette = (c) => {
  let primary;
  let secondary;
  let text;
  let pLightness;

  c.forEach((i) => {
    i.pRation = i.area + i.intensity - i.lightness;
  });
  c.sort((a, b) => b.pRation - a.pRation);

  if (
    Math.round(c[0].lightness) !== Math.round(c[1].lightness) &&
    c[2].pRation < -0.1
  ) {
    c.forEach((i) => {
      i.pRation = i.area + i.intensity + i.lightness;
    });
    c = c.sort((a, b) => b.pRation - a.pRation);
  }

  primary = c[0].hex;
  secondary = c[1].hex;
  pLightness =
    Math.round(c[0].lightness + c[0].saturation) +
    Math.round(c[1].lightness + c[1].saturation);

  if (pLightness < 2) {
    text = lightHex(c);
    if (text == primary || text == secondary) {
      text = darkHex(c);
    }
  } else {
    text = darkHex(c);
    if (text == primary || text == secondary) {
      text = lightHex(c);
    }
  }
  return { primary: primary, secondary: secondary, text: text };
};
</script>

<template>
  <div
    class="w-screen h-screen bg-teal-500 flex justify-center items-center p-12 overflow-hidden"
  >
    <div
      class="w-1/2 max-h-full h-full overflow-scroll outline outline-1 outline-teal-950 rounded-xl p-8 bg-teal-200 flex flex-col items-center"
    >
      <div class="flex flex-col gap-2">
        <input v-model="user.name" />
        <select v-model="period">
          <option value="7day">Semanal</option>
          <option value="1month">Mensal</option>
          <option value="3month">Trimestral</option>
          <option value="6month">Semestral</option>
          <option value="12month">Anual</option>
          <option value="overall">Geral</option>
        </select>
        <button @click="handleClick(user.name, period, key)">Gerar</button>
      </div>
      <div
        id="print"
        class="w-[386px] h-full flex flex-col justify-center"
      ></div>
      <div id="canvas" class="absolute w-[1080px] h-[1920px] left-[10000px]">
        <div id="background" class="absolute z-10 w-[1080px] h-[1920px]"></div>
        <div id="post" class="absolute z-20 w-[1080px] h-[1920px]">
          <div
            v-if="load"
            class="p-12 flex flex-row gap-12 h-[1920px] w-[1080px]"
          >
            <div class="flex flex-col">
              <img
                v-for="i in grid"
                :key="i['#text']"
                :src="i['#text']"
                alt=""
                class="w-[228px] max-w-[228px]"
              />
            </div>

            <div class="flex flex-col w-[708px] h-full justify-between">
              <div class="flex flex-col gap-4 pb-16">
                <div class="flex flex-row gap-6 items-center w-full">
                  <img class="w-[300px]" :src="number1[0].image['#text']" />
                  <span class="text-8xl font-bold">#1</span>
                </div>
                <div>
                  <p class="text-4xl leading-tight truncate">
                    {{ number1[0].artist }}
                  </p>
                  <p class="text-[2.5rem] font-semibold leading-tight truncate">
                    {{ number1[0].album }}
                  </p>
                </div>
              </div>
              <div>
                <h2 class="text-[2rem] leading-tight">Top Albums</h2>
                <ol class="list-decimal list-inside" start="2">
                  <li
                    v-for="i in albums"
                    :key="i.album"
                    class="font-semibold text-[2.5rem] leading-tight truncate"
                  >
                    {{ i.album }}
                  </li>
                </ol>
              </div>
              <div>
                <h2 class="text-[2rem] leading-tight">Top Artists</h2>
                <ol class="list-decimal list-inside">
                  <li
                    v-for="i in artists"
                    :key="i.artist"
                    class="font-semibold text-[2.5rem] leading-tight truncate"
                  >
                    {{ i.artist }}
                  </li>
                </ol>
              </div>
              <div>
                <h2 class="text-[2rem] leading-tight">Top Tracks</h2>
                <ol class="list-decimal list-inside">
                  <li
                    v-for="i in tracks"
                    :key="i.track"
                    class="font-semibold text-[2.5rem] leading-tight truncate"
                  >
                    {{ i.track }}
                  </li>
                </ol>
              </div>
              <div class="flex flex-row justify-between">
                <div>
                  <h2 class="text-[2rem] leading-tight">Top Género</h2>
                  <p
                    class="font-semibold text-[2.5rem] leading-tight truncate capitalize"
                  >
                    {{ g }}
                  </p>
                </div>
                <div>
                  <h2 class="text-[2rem] leading-tight">Total</h2>
                  <p class="font-semibold text-[2.5rem] leading-tight">
                    {{ trackCount }} tracks
                  </p>
                </div>
              </div>
              <div class="flex flex-row justify-between h-fit">
                <div class="flex flex-row items-center gap-4">
                  <img :src="user.img" class="h-[68px] w-[68px] rounded-full" />
                  <p class="text-[2rem] font-semibold leading-none">
                    {{ user.name }}
                  </p>
                </div>
                <div class="flex flex-col text-right">
                  <span class="text-[2rem] font-semibold leading-tight"
                    >TopTop {{ timespan }}</span
                  >
                  <span class="text-2xl leading-tight">{{ fullDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
