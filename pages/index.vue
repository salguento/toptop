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
                                    <svg
                                        width="56"
                                        height="56"
                                        viewBox="0 0 56 56"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M10.0185 34.7615C7.97667 34.7615 6.2071 34.3414 4.70977 33.501C3.21245 32.6606 2.05088 31.485 1.22509 29.974C0.408362 28.463 0 26.6974 0 24.6771C0 22.6568 0.408362 20.8869 1.22509 19.3675C2.05088 17.848 3.21245 16.6681 4.70977 15.8277C6.2071 14.9874 7.97667 14.5672 10.0185 14.5672C12.0603 14.5672 13.8298 14.9874 15.3272 15.8277C16.8245 16.6681 17.9815 17.848 18.7982 19.3675C19.624 20.8869 20.0369 22.6568 20.0369 24.6771C20.0369 26.6974 19.624 28.463 18.7982 29.974C17.9815 31.485 16.8245 32.6606 15.3272 33.501C13.8298 34.3414 12.0603 34.7615 10.0185 34.7615ZM10.0457 31.069C11.1528 31.069 12.0784 30.7846 12.8226 30.2159C13.5667 29.6387 14.1202 28.8662 14.4832 27.8985C14.8553 26.9308 15.0413 25.8528 15.0413 24.6644C15.0413 23.4675 14.8553 22.3852 14.4832 21.4175C14.1202 20.4413 13.5667 19.6646 12.8226 19.0874C12.0784 18.5101 11.1528 18.2215 10.0457 18.2215C8.91136 18.2215 7.96759 18.5101 7.21439 19.0874C6.47026 19.6646 5.91217 20.4413 5.54011 21.4175C5.17712 22.3852 4.99562 23.4675 4.99562 24.6644C4.99562 25.8528 5.17712 26.9308 5.54011 27.8985C5.91217 28.8662 6.47026 29.6387 7.21439 30.2159C7.96759 30.7846 8.91136 31.069 10.0457 31.069Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            d="M32.2815 4.68571C32.8338 4.68571 33.2815 5.13342 33.2815 5.68571V7.25092C33.2815 7.8032 32.8338 8.25092 32.2815 8.25092H22.262C21.7097 8.25092 21.262 7.8032 21.262 7.25092V5.68571C21.262 5.13342 21.7097 4.68571 22.262 4.68571H32.2815ZM24.2295 0.999999C24.2295 0.447714 24.6772 0 25.2295 0H28.157C28.7093 0 29.157 0.447715 29.157 1V18.3608C29.157 18.9805 29.2568 19.4559 29.4565 19.7869C29.6652 20.1095 29.9375 20.3302 30.2732 20.449C30.609 20.5679 30.981 20.6273 31.3894 20.6273C31.6979 20.6273 31.9793 20.6061 32.2334 20.5636V20.5636C32.5642 20.5103 32.894 20.7169 32.9692 21.0434L33.4565 23.158C33.5731 23.6639 33.2812 24.1699 32.774 24.2811C32.6969 24.298 32.6165 24.3152 32.5328 24.3326C32.0519 24.4344 31.462 24.4938 30.7632 24.5108C29.5291 24.5448 28.4174 24.3708 27.4283 23.9888C26.4392 23.5983 25.6542 22.9956 25.0734 22.1807C24.5017 21.3658 24.2204 20.3472 24.2295 19.1248V0.999999Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            d="M45.9815 28.0386C43.9397 28.0386 42.1701 27.6184 40.6728 26.778C39.1755 25.9377 38.0139 24.762 37.1881 23.251C36.3714 21.74 35.9631 19.9744 35.9631 17.9541C35.9631 15.9338 36.3714 14.164 37.1881 12.6445C38.0139 11.125 39.1755 9.94513 40.6728 9.10476C42.1701 8.26439 43.9397 7.8442 45.9815 7.8442C48.0233 7.8442 49.7929 8.26439 51.2902 9.10476C52.7876 9.94513 53.9446 11.125 54.7613 12.6445C55.5871 14.164 56 15.9338 56 17.9541C56 19.9744 55.5871 21.74 54.7613 23.251C53.9446 24.762 52.7876 25.9377 51.2902 26.778C49.7929 27.6184 48.0233 28.0386 45.9815 28.0386ZM46.0088 24.346C47.1159 24.346 48.0415 24.0617 48.7856 23.4929C49.5297 22.9157 50.0833 22.1432 50.4463 21.1755C50.8183 20.2078 51.0044 19.1298 51.0044 17.9414C51.0044 16.7445 50.8183 15.6622 50.4463 14.6945C50.0833 13.7183 49.5297 12.9416 48.7856 12.3644C48.0415 11.7872 47.1159 11.4985 46.0088 11.4985C44.8744 11.4985 43.9306 11.7872 43.1774 12.3644C42.4333 12.9416 41.8752 13.7183 41.5032 14.6945C41.1402 15.6622 40.9587 16.7445 40.9587 17.9414C40.9587 19.1298 41.1402 20.2078 41.5032 21.1755C41.8752 22.1432 42.4333 22.9157 43.1774 23.4929C43.9306 24.0617 44.8744 24.346 46.0088 24.346Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            d="M22.4118 56C21.8595 56 21.4118 55.5523 21.4118 55V30.1081C21.4118 29.5559 21.8595 29.1081 22.4118 29.1081H25.2577C25.8099 29.1081 26.2577 29.5559 26.2577 30.1081V32.1636C26.2577 32.2623 26.3377 32.3423 26.4364 32.3423V32.3423C26.5023 32.3423 26.5627 32.3059 26.5949 32.2483C26.8451 31.8005 27.1864 31.3268 27.6189 30.8271C28.0817 30.2838 28.7078 29.8212 29.4973 29.4392C30.2868 29.0487 31.2941 28.8535 32.5192 28.8535C34.1345 28.8535 35.591 29.2397 36.8887 30.0122C38.1954 30.7762 39.2299 31.9094 39.9922 33.4119C40.7636 34.9059 41.1492 36.7394 41.1492 38.9125C41.1492 41.0601 40.7726 42.8851 40.0194 44.3876C39.2662 45.8901 38.2408 47.036 36.9431 47.8255C35.6454 48.6149 34.1753 49.0096 32.5328 49.0096C31.335 49.0096 30.3413 48.8229 29.5518 48.4494C28.7623 48.0759 28.127 47.626 27.6461 47.0997C27.196 46.5896 26.8408 46.1065 26.5806 45.6504C26.5574 45.6099 26.5145 45.5845 26.4678 45.5845V45.5845C26.3968 45.5845 26.3393 45.642 26.3393 45.713V55C26.3393 55.5523 25.8916 56 25.3393 56H22.4118ZM26.244 38.887C26.244 40.1518 26.4346 41.2596 26.8158 42.2103C27.206 43.161 27.7641 43.9037 28.49 44.4385C29.2251 44.9648 30.1144 45.228 31.158 45.228C32.247 45.228 33.159 44.9563 33.894 44.4131C34.6291 43.8613 35.1826 43.1101 35.5547 42.1593C35.9358 41.2001 36.1264 40.1093 36.1264 38.887C36.1264 37.6731 35.9404 36.5951 35.5683 35.6528C35.1962 34.7106 34.6427 33.9721 33.9076 33.4373C33.1726 32.9025 32.256 32.6352 31.158 32.6352C30.1053 32.6352 29.2115 32.8941 28.4764 33.4119C27.7414 33.9297 27.1833 34.6554 26.8021 35.5892C26.4301 36.5229 26.244 37.6222 26.244 38.887Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    <div class="flex flex-col">
                                        <span
                                            class="text-[2rem] font-semibold leading-tight"
                                            >{{ timespan }}</span
                                        >
                                        <span class="text-2xl leading-tight">{{
                                            fullDate
                                        }}</span>
                                    </div>
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
