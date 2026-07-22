<script setup>
import { storeToRefs } from "pinia";
import { extractColors } from "extract-colors";
// import domtoimage from "dom-to-image-more";
// Dictionary
import genreList from "~/static/genreDictionary.json";
// Store
// import { useTopTopStore } from "@/stores/TopTopStore";
// Composables
import useGetUserImage from "~/composables/useLastFm/useGetUserImage";
import useGetTracks from "~/composables/useLastFm/useGetUserTracks";
import useGetAlbums from "~/composables/useLastFm/useGetAlbums";
import useGetArtists from "~/composables/useLastFm/useGetArtists";

//Utils
import getColors from "~/utils/getColors";
import getGradientPalette, {
    getGradientColorCount,
} from "~/utils/getGradientPalette";
import getArtisticGradient from "~/utils/getArtisticGradient";
import LastFmErrorCheck from "~/utils/LastFmErrorCheck";
// Meta
if (import.meta.server) {
    useSeoMeta({
        title: "toptop",
        description: "Unwrap Last.fm",
        ogTitle: "toptop",
        ogDescription: "Unwrap Last.fm",
        ogType: "website",
        ogSiteName: "toptop",
        ogLocale: "en_US",
        ogUrl: "https://toptop.salguento.xyz/",
        ogImage: "https://toptop.salguento.xyz/og-image.jpg",
        ogImageAlt: "toptop — Unwrap Last.fm",
        ogImageWidth: 1200,
        ogImageHeight: 630,
        ogImageType: "image/jpeg",
        twitterCard: "summary_large_image",
        twitterTitle: "toptop",
        twitterDescription: "Unwrap Last.fm",
        twitterImage: "https://toptop.salguento.xyz/og-image.jpg",
        twitterImageAlt: "toptop — Unwrap Last.fm",
    });
}

useHead({
    htmlAttrs: {
        lang: "en",
    },
    link: [
        {
            rel: "canonical",
            href: "https://toptop.salguento.xyz/",
        },
        {
            rel: "icon",
            type: "image/x-icon",
            href: "/favicon.ico",
        },
    ],
});
// Local variables
const config = useRuntimeConfig();
const apiRoot = config.public.apiBase;
const key = config.public.apiKey;

let domtoimage = null;
let generationId = 0;
let generatedImageBlob = null;
let generatedImageUrl = "";
let snackTimeoutId;

// const topTopStore = useTopTopStore();
// const { albums, number1, grid, genres, colors, user, tracks, artists } =
//   storeToRefs(topTopStore);
const user = ref({
    name: "",
    img: "",
});
const period = ref("7day");
const hideMissingArtwork = ref(false);
const load = ref(false);
const loading = ref(false);
const previewOpen = ref(false);
const imageReady = ref(false);
const timespan = ref("");
const g = ref("");
const imgUrl = ref("");
const snackMessage = ref("");
const usernameInput = ref(null);

const date = new Date();
const day = date.getDate();
const month = date.getMonth() + 1;
const year = date.getFullYear();
const fullDate = day + "/" + month + "/" + year;

const errMsg = ref("");

let tracks = {};
let artists = [];
let albums = [];
let number1 = [];
let grid = [];
let genres = [];
let albumColorSets = [];
let gradientPalette = null;
let mess = {};
let stats;

const handleClick = async (u, p, k) => {
    if (loading.value) return;

    const username = u.trim();
    const shouldHideMissingArtwork = hideMissingArtwork.value;
    clear();
    const currentGeneration = generationId;
    user.value.name = username;
    errMsg.value = LastFmErrorCheck(0, username);
    if (errMsg.value) {
        return;
    }

    loading.value = true;
    try {
        setTimespan();
        const [userData, topTracks, albumData, artistData] =
            await Promise.all([
                useGetUserImage(username, k),
                useGetTracks(username, p, k),
                useGetAlbums(username, p, k, shouldHideMissingArtwork),
                useGetArtists(username, p, k),
            ]);

        if (currentGeneration !== generationId) return;

        user.value.img = userData.image;
        tracks = {
            ...topTracks,
            scrobbleCount:
                topTracks.scrobbleCount ?? userData.overallScrobbleCount,
        };
        mess = albumData;
        artists = artistData.artists;
        stats = {
            uniqueArtists: artistData.totalArtists,
            uniqueAlbums: albumData.totalAlbums,
        };

        if (
            tracks.tracks.length === 0 ||
            mess.number1.length === 0 ||
            artists.length === 0
        ) {
            errMsg.value =
                "Not enough listening history for this period. Try a longer period.";
            return;
        }

        if (
            shouldHideMissingArtwork &&
            mess.artworkCount < 13
        ) {
            errMsg.value = `Only ${mess.artworkCount} albums with artwork were found. Try a longer period or disable “Hide missing artwork”.`;
            return;
        }

        const colorCount = getGradientColorCount(tracks.scrobbleCount);
        albumColorSets = await Promise.all(
            mess.paletteAlbums
                .slice(0, colorCount)
                .map(({ image }) => getColors(image)),
        );
        gradientPalette = getGradientPalette(
            albumColorSets,
            tracks.scrobbleCount,
        );
        if (currentGeneration !== generationId) return;

        load.value = true;
        await nextTick();
        if (currentGeneration !== generationId) return;

        addColors();
        await waitForCanvasImages();
        if (currentGeneration !== generationId) return;

        await print(currentGeneration);
    } catch (err) {
        if (currentGeneration !== generationId) return;

        const rawErrorCode =
            err?.response?._data?.error ?? err?.data?.error ?? err?.error;
        const rawErrorMessage =
            err?.response?._data?.message ?? err?.data?.message ?? err?.message;
        const errorCode =
            Number(rawErrorCode) ||
            (/user not found/i.test(rawErrorMessage ?? "") ? 6 : 0);

        errMsg.value =
            LastFmErrorCheck(errorCode, user.value.name) ||
            "Unable to generate your Toptop right now. Please try again.";
        console.error(err);
    } finally {
        if (currentGeneration === generationId) {
            loading.value = false;
        }
    }
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
            timespan.value = "Quarterly";
            break;
        case "6month":
            timespan.value = "Biannually";
            break;
        case "12month":
            timespan.value = "Yearly";
            break;
        case "overall":
            timespan.value = "Overall";
            break;
    }
};

const waitForCanvasImages = async () => {
    const node = document.getElementById("canvas");
    if (!node) throw new Error("Canvas element was not found");

    const images = Array.from(node.querySelectorAll("img"));
    await Promise.all(
        images.map((image) => {
            if (image.complete) return Promise.resolve();

            return new Promise((resolve) => {
                let timeoutId;
                const finish = () => {
                    image.removeEventListener("load", finish);
                    image.removeEventListener("error", finish);
                    clearTimeout(timeoutId);
                    resolve();
                };

                image.addEventListener("load", finish, { once: true });
                image.addEventListener("error", finish, { once: true });
                timeoutId = setTimeout(finish, 5000);
            });
        }),
    );
};

const getArtworkProxyUrl = (artwork) =>
    artwork ? `/api/image?url=${encodeURIComponent(artwork)}` : "";

const print = async (currentGeneration) => {
    const node = document.getElementById("canvas");
    const printContainer = document.getElementById("print");

    try {
        if (!node || !printContainer) {
            throw new Error("Image container was not found");
        }

        domtoimage ??= await import("dom-to-image-more");
        const blob = await domtoimage.toBlob(node, {
            copyDefaultStyles: false,
            disableEmbedFonts: true,
            height: 1920,
            width: 1080,
        });

        if (currentGeneration !== generationId) return;

        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.alt = "Generated Toptop image";

        const imageLoaded = new Promise((resolve, reject) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", reject, { once: true });
        });

        img.src = objectUrl;
        printContainer.replaceChildren(img);

        try {
            await imageLoaded;
        } catch {
            URL.revokeObjectURL(objectUrl);
            throw new Error("Generated image could not be loaded");
        }

        if (currentGeneration !== generationId) {
            URL.revokeObjectURL(objectUrl);
            return;
        }

        generatedImageBlob = blob;
        generatedImageUrl = objectUrl;
        imgUrl.value = objectUrl;
        imageReady.value = true;
    } catch (error) {
        if (currentGeneration !== generationId) return;

        console.error("Unable to create image", error);
        load.value = false;
        throw error;
    }
};

const getGeneratedImageName = () => {
    const safeUsername =
        user.value.name.trim().replace(/[^a-z0-9_-]+/gi, "-") || "user";
    const safePeriod = timespan.value.toLowerCase() || "period";
    const safeDate = [
        year,
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
    ].join("-");

    return `toptop-${safeUsername}-${safePeriod}-${safeDate}.png`;
};

const getGeneratedImageFile = () => {
    if (!generatedImageBlob || typeof File !== "function") return null;

    return new File(
        [generatedImageBlob],
        getGeneratedImageName(),
        {
            type: "image/png",
            lastModified: Date.now(),
        },
    );
};

const canShareImageFile = (file) => {
    try {
        return (
            file &&
            typeof navigator.share === "function" &&
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [file] })
        );
    } catch {
        return false;
    }
};

const shareImageFile = async (file) => {
    if (!canShareImageFile(file)) return "unsupported";

    try {
        await navigator.share({
            files: [file],
            title: "My Toptop",
            text: "My listening stats on Toptop",
        });
        return "shared";
    } catch (error) {
        if (error?.name === "AbortError") return "cancelled";
        return "failed";
    }
};

const saveImageWithFilePicker = async (suggestedName) => {
    if (typeof window.showSaveFilePicker !== "function") {
        return "unsupported";
    }

    try {
        const fileHandle = await window.showSaveFilePicker({
            suggestedName,
            types: [
                {
                    description: "PNG image",
                    accept: { "image/png": [".png"] },
                },
            ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(generatedImageBlob);
        await writable.close();
        return "saved";
    } catch (error) {
        if (error?.name === "AbortError") return "cancelled";
        return "failed";
    }
};

const downloadGeneratedImage = (fileName) => {
    if (!generatedImageBlob || !generatedImageUrl) return false;

    try {
        const downloadLink = document.createElement("a");
        downloadLink.href = generatedImageUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        return true;
    } catch {
        return false;
    }
};

const handleSave = async () => {
    const file = getGeneratedImageFile();
    if (!imageReady.value || !generatedImageBlob || !generatedImageUrl) {
        snack("Image is not ready yet");
        return;
    }

    const fileName = file?.name ?? getGeneratedImageName();
    const saveResult = await saveImageWithFilePicker(fileName);
    if (saveResult === "saved") {
        snack("Image saved");
        return;
    }
    if (saveResult === "cancelled") return;

    const shareResult = file ? await shareImageFile(file) : "unsupported";
    if (shareResult === "shared") {
        snack("Opened device share options");
        return;
    }
    if (shareResult === "cancelled") return;

    if (downloadGeneratedImage(fileName)) {
        snack("PNG download started");
        return;
    }

    snack("Unable to save the image. Please try again.");
};

const openPreview = () => {
    if (imgUrl.value) {
        previewOpen.value = true;
    }
};

const closePreview = () => {
    previewOpen.value = false;
};

const handlePreviewKeydown = (event) => {
    if (event.key === "Escape") {
        closePreview();
    }
};

watch(load, async (isShowingResult, wasShowingResult) => {
    if (!isShowingResult && wasShowingResult) {
        await nextTick();
        usernameInput.value?.focus();
    }
});

const clear = () => {
    generationId += 1;
    loading.value = false;
    closePreview();

    const print = document.getElementById("print");
    while (print.hasChildNodes()) {
        print.removeChild(print.firstChild);
    }

    load.value = false;
    imageReady.value = false;
    imgUrl.value = "";
    generatedImageBlob = null;
    if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
        generatedImageUrl = "";
    }
    snackMessage.value = "";
    timespan.value = "";
    g.value = "";
    errMsg.value = "";
    tracks = {};
    artists = [];
    albums = [];
    number1 = [];
    grid = [];
    genres = [];
    albumColorSets = [];
    gradientPalette = null;
};

const addColors = () => {
    const background = document.getElementById("background");
    const post = document.getElementById("post");

    if (!background || !post || !gradientPalette) {
        throw new Error("Gradient elements or palette were not found");
    }

    const artisticGradient = getArtisticGradient(mess.topGenre, {
        colors: gradientPalette.colors,
        weights: gradientPalette.weights,
    });

    background.style.backgroundColor = gradientPalette.colors[0];
    background.style.backgroundImage = artisticGradient.backgroundImage;
    post.style.color = gradientPalette.text;
};

const copyGeneratedImage = async () => {
    const file = getGeneratedImageFile();
    if (!imageReady.value || !generatedImageBlob) {
        snack("Image is not ready yet");
        return;
    }

    try {
        if (
            typeof ClipboardItem !== "function" ||
            typeof navigator.clipboard?.write !== "function"
        ) {
            throw new Error("Clipboard API not supported");
        }

        const clipboardItem = new ClipboardItem({
            "image/png": generatedImageBlob,
        });

        await navigator.clipboard.write([clipboardItem]);
        snack("Image copied");
    } catch {
        const shareResult = file ? await shareImageFile(file) : "unsupported";
        if (shareResult === "shared") {
            snack("Clipboard unavailable; opened share options");
        } else if (shareResult !== "cancelled") {
            snack("This browser cannot copy images");
        }
    }
};

const snack = (message) => {
    clearTimeout(snackTimeoutId);
    snackMessage.value = message;
    snackTimeoutId = setTimeout(() => {
        snackMessage.value = "";
    }, 2500);
};

onMounted(async () => {
    document.addEventListener("keydown", handlePreviewKeydown);
    usernameInput.value?.focus();

    // Import only on client-side
    domtoimage = await import("dom-to-image-more");
});

onBeforeUnmount(() => {
    document.removeEventListener("keydown", handlePreviewKeydown);
    clearTimeout(snackTimeoutId);
    if (generatedImageUrl) URL.revokeObjectURL(generatedImageUrl);
});
</script>

<template>
    <div
        class="relative isolate w-full h-[100dvh] min-h-screen flex justify-center items-center p-2 md:p-12 overflow-hidden"
    >
        <Background />
        <div
            class="relative z-10 w-full container max-w-lg max-h-full h-fit overflow-scroll outline outline-1 outline-slate-500/20 rounded-[1.25rem] px-4 pt-6 pb-4 md:p-8 bg-slate-900/50 backdrop-blur-3xl flex flex-col items-center gap-4 md:gap-8"
        >
            <div class="flex flex-col text-center">
                <div
                    class="w-full flex justify-center items-center md:gap-2 gap-1"
                >
                    <img class="h-9" src="/toptop.svg" alt="Toptop logo" />
                </div>
            </div>
            <form
                v-if="!load"
                class="relative flex w-full flex-col gap-2 px-12"
                autocomplete="off"
                @submit.prevent="handleClick(user.name, period, key)"
            >
                <div class="flex flex-col gap-2 w-full">
                    <div class="w-full">
                        <input
                            ref="usernameInput"
                            v-model="user.name"
                            type="text"
                            name="lastfm-profile"
                            id="lastfm-profile"
                            autocomplete="off"
                            autocapitalize="none"
                            spellcheck="false"
                            data-bwignore="true"
                            data-1p-ignore="true"
                            data-lpignore="true"
                            autofocus
                            placeholder="Last.fm user"
                            class="block w-full rounded-[0.625rem] bg-slate-700/90 px-3.5 py-2 text-base text-white focus:outline -outline-offset-2 outline-slate-300/90 placeholder:text-slate-400 focus:-outline-offset-2 focus:outline-white"
                        />
                    </div>

                    <div class="focus-within:relative grid grid-cols-1 w-full">
                        <select
                            v-model="period"
                            id="listening-period"
                            name="listening-period"
                            autocomplete="off"
                            aria-label="Listening period"
                            class="col-start-1 row-start-1 w-full appearance-none rounded-[0.625rem] bg-slate-700/90 py-2 pl-3.5 pr-7 text-base text-white outline-slate-300/90 focus:outline focus:-outline-offset-2 focus:outline-white"
                        >
                            <option value="7day">Weekly</option>
                            <option value="1month">Monthly</option>
                            <option value="3month">Quarterly</option>
                            <option value="6month">Biannually</option>
                            <option value="12month">Yearly</option>
                            <option value="overall">Overall</option>
                        </select>
                        <svg
                            class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-slate-400 sm:size-4"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            aria-hidden="true"
                            data-slot="icon"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>
                </div>
                <div v-if="errMsg" class="w-full bg-red-500/90 rounded-full">
                    <p class="text-red-100 text-center font-medium">
                        {{ errMsg }}
                    </p>
                </div>
                <label
                    for="hide-missing-artwork"
                    class="flex w-full cursor-pointer items-center gap-3 rounded-[0.625rem] px-3.5 py-2.5 text-sm font-medium text-white"
                >
                    <input
                        id="hide-missing-artwork"
                        v-model="hideMissingArtwork"
                        type="checkbox"
                        class="peer sr-only"
                    />
                    <span
                        aria-hidden="true"
                        class="flex size-5 shrink-0 items-center justify-center rounded-md border border-slate-400 bg-slate-800/80 transition-colors peer-checked:border-white peer-checked:bg-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white"
                    >
                        <Icon
                            v-if="hideMissingArtwork"
                            name="i-solar:check-read-linear"
                            class="size-4 text-slate-800"
                        />
                    </span>
                    <span>Hide missing artwork</span>
                </label>
                <div class="w-full">
                    <button
                        id="btn-generate"
                        type="submit"
                        :disabled="loading"
                        class="text-white w-full bg-slate-700/90 hover:bg-slate-50/90 hover:text-slate-700 font-semibold focus:outline focus:-outline-offset-2 focus:outline-white rounded-[0.625rem] text-base leading-tight px-5 py-2.5 text-center me-2 inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <svg
                            v-if="loading"
                            aria-hidden="true"
                            role="status"
                            class="inline w-4 h-4 me-3 text-white animate-spin"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="currentColor"
                            />
                            <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentColor"
                            />
                        </svg>
                        {{ loading ? "Loading" : "Generate" }}
                    </button>
                </div>
            </form>

            <div
                id="print"
                :role="imgUrl ? 'button' : undefined"
                :tabindex="imgUrl ? 0 : undefined"
                :aria-label="imgUrl ? 'View generated image in full screen' : undefined"
                class="rounded-[0.625rem] relative overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                :class="{ 'cursor-zoom-in': imgUrl }"
                @click="openPreview"
                @keydown.enter="openPreview"
                @keydown.space.prevent="openPreview"
            ></div>
            <!-- <div id="canvas" class="overflow-hidden"> -->
            <div id="canvas" class="absolute left-[10000px] overflow-hidden">
                <div
                    id="background"
                    class="absolute z-10 w-[1080px] h-[1920px]"
                ></div>
                <div id="post" class="absolute z-20 w-[1080px] h-[1920px]">
                    <div
                        v-if="load"
                        class="p-12 flex flex-col gap-12 h-[1920px] w-[1080px]"
                    >
                        <div
                            class="flex flex-col w-full h-full justify-between"
                        >
                            <!-- HEADER -->
                            <div class="flex flex-row justify-between h-fit">
                                <div class="flex flex-row items-center gap-4">
                                    <img
                                        :src="user.img"
                                        class="h-[68px] w-[68px] rounded-full"
                                    />
                                    <p
                                        class="text-[2rem] font-semibold leading-none pb-2"
                                    >
                                        {{ user.name }}
                                    </p>
                                </div>
                                <div
                                    class="flex flex-row text-right items-center gap-2"
                                >
                                    <div class="flex flex-col">
                                        <span
                                            class="text-[2rem] font-semibold leading-tight"
                                            >{{ timespan }}</span
                                        >
                                        <span class="text-2xl leading-tight">{{
                                            fullDate
                                        }}</span>
                                    </div>
                                    <GeneratedLogo />
                                </div>
                            </div>
                            <div class="flex flex-col gap-4">
                                <div
                                    class="flex flex-col gap-6 items-center justify-center w-full"
                                >
                                    <div
                                        class="grid grid-cols-4 overflow-hidden rounded-2xl shadow-xl"
                                    >
                                        <img
                                            v-for="i in mess.grid"
                                            :key="i"
                                            :src="getArtworkProxyUrl(i)"
                                            alt=""
                                            class="max-w-[246px]"
                                        />
                                        <img
                                            class="w-[512px] shadow-xl col-span-2 col-start-2 row-start-2 row-span-2"
                                            :src="getArtworkProxyUrl(mess.number1[0].image)"
                                        />
                                    </div>
                                    <div class="text-center w-full">
                                        <p
                                            class="text-[2.5rem] font-semibold leading-tight truncate"
                                        >
                                            {{ mess.number1[0].album }}
                                        </p>
                                        <p
                                            class="text-4xl leading-tight truncate"
                                        >
                                            {{ mess.number1[0].artist }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <!-- <div>
                <h2 class="text-[2rem] leading-tight">TOP ALBUMS</h2>
                <ol class="list-decimal list-inside" start="2">
                  <li
                    v-for="i in mess.albums"
                    :key="i.album"
                    class="font-semibold text-[2.5rem] leading-tight truncate"
                  >
                    {{ i.album }}
                  </li>
                </ol>
              </div> -->
                            <div class="grid grid-flow-row grid-cols-2 gap-8">
                                <div class="w-full">
                                    <h2 class="text-[1.5rem] leading-tight">
                                        TOP ARTISTS
                                    </h2>
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
                                <div class="w-full">
                                    <h2 class="text-[1.5rem] leading-tight">
                                        TOP TRACKS
                                    </h2>
                                    <ol class="list-decimal list-inside">
                                        <li
                                            v-for="i in tracks.tracks"
                                            :key="i.track"
                                            class="font-semibold text-[2.5rem] leading-tight truncate"
                                        >
                                            {{ i.track }}
                                        </li>
                                    </ol>
                                </div>
                            </div>
                            <div
                                class="grid grid-flow-row grid-cols-2 justify-between gap-8"
                            >
                                <div>
                                    <h2 class="text-[1.5rem] leading-tight">
                                        TOP GENRE
                                    </h2>
                                    <p
                                        class="font-semibold text-[2.5rem] leading-tight truncate capitalize w-full pr-8"
                                    >
                                        {{ mess.topGenre }}
                                    </p>
                                </div>
                                <div>
                                    <h2 class="text-[1.5rem] leading-tight">
                                        TOTAL TRACKS
                                    </h2>
                                    <p
                                        class="font-semibold text-[2.5rem] leading-tight"
                                    >
                                        {{ tracks.scrobbleCount }}
                                    </p>
                                </div>
                                <div v-if="stats.uniqueArtists != 0">
                                    <h2 class="text-[1.5rem] leading-tight">
                                        TOTAL ARTISTS
                                    </h2>
                                    <p
                                        class="font-semibold text-[2.5rem] leading-tight"
                                    >
                                        {{ stats.uniqueArtists }}
                                    </p>
                                </div>
                                <div v-if="stats.uniqueAlbums != 0">
                                    <h2 class="text-[1.5rem] leading-tight">
                                        TOTAL ALBUMS
                                    </h2>
                                    <p
                                        class="font-semibold text-[2.5rem] leading-tight"
                                    >
                                        {{ stats.uniqueAlbums }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="imageReady" class="w-full flex flex-row gap-2">
                <button
                    type="button"
                    @click="clear()"
                    class="w-full rounded-md bg-slate-700/90 px-3.5 leading-tight py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800/90 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white flex flex-row items-center gap-2 justify-center"
                    title="Return"
                >
                    <Icon name="i-solar:arrow-left-linear" class="h-6 w-6" />
                    <span>Return</span>
                </button>
                <button
                    type="button"
                    @click="handleSave()"
                    class="w-full rounded-md bg-slate-700/90 px-3.5 leading-tight py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800/90 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white flex flex-row items-center gap-2 justify-center"
                    title="Save"
                >
                    <Icon
                        name="i-solar:gallery-download-linear"
                        class="h-6 w-6"
                    />
                    <span>Save</span>
                </button>
                <div class="w-full relative place-items-center grid">
                    <button
                        type="button"
                        @click="copyGeneratedImage()"
                        class="w-full rounded-md bg-slate-700/90 px-3.5 leading-tight py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800/90 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white flex flex-row items-center gap-2 justify-center"
                        title="Copy to clipboard"
                    >
                        <Icon name="i-solar:copy-outline" class="h-6 w-6" />
                        <span>Copy</span>
                    </button>
                    <span
                        v-if="snackMessage"
                        role="status"
                        aria-live="polite"
                        class="absolute -top-12 z-100 whitespace-nowrap px-3 py-2 text-xs font-medium text-white bg-slate-950/90 rounded-full shadow-xs"
                    >
                        {{ snackMessage }}
                    </span>
                </div>
            </div>
            <footer class="flex w-full items-center justify-center pb-1">
                <a
                    href="https://salguento.xyz"
                    class="inline-flex min-h-9 w-full items-center justify-center rounded-md px-3 py-2 text-xs leading-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
                    >salguento 👾 {{ year }}
                </a>
            </footer>
        </div>

        <Teleport to="body">
            <div
                v-if="previewOpen"
                class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm md:p-8"
                role="dialog"
                aria-modal="true"
                aria-label="Generated image preview"
                @click.self="closePreview"
            >
                <button
                    type="button"
                    class="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-3xl leading-none text-white shadow-lg hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-8 md:top-8"
                    aria-label="Close full-screen preview"
                    title="Close"
                    @click="closePreview"
                >
                    <span aria-hidden="true">&times;</span>
                </button>
                <img
                    :src="imgUrl"
                    alt="Generated Toptop image"
                    class="max-h-full max-w-full rounded-[0.625rem] object-contain shadow-2xl"
                    @click.stop
                />
            </div>
        </Teleport>
    </div>
</template>

<style>
html,
body,
#__nuxt {
    background-color: #0f0f1e;
}

.container {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
.container::-webkit-scrollbar {
    display: none;
}
#print img {
    display: block;
    max-height: 100%;
}
</style>
