<script setup lang="ts">
const bars = [
    { low: 0.18, mid: 0.48, peak: 0.76, duration: "1.38s", delay: "-0.84s", color: "#22d3ee" },
    { low: 0.32, mid: 0.72, peak: 0.94, duration: "1.12s", delay: "-0.25s", color: "#38bdf8" },
    { low: 0.12, mid: 0.44, peak: 0.68, duration: "1.56s", delay: "-1.12s", color: "#60a5fa" },
    { low: 0.42, mid: 0.68, peak: 0.88, duration: "1.24s", delay: "-0.68s", color: "#818cf8" },
    { low: 0.24, mid: 0.58, peak: 0.82, duration: "1.72s", delay: "-1.31s", color: "#8b5cf6" },
    { low: 0.36, mid: 0.76, peak: 1, duration: "1.18s", delay: "-0.46s", color: "#a855f7" },
    { low: 0.16, mid: 0.5, peak: 0.74, duration: "1.46s", delay: "-0.96s", color: "#c084fc" },
    { low: 0.46, mid: 0.64, peak: 0.9, duration: "1.3s", delay: "-0.17s", color: "#d946ef" },
    { low: 0.22, mid: 0.7, peak: 0.96, duration: "1.62s", delay: "-1.22s", color: "#e879f9" },
    { low: 0.38, mid: 0.56, peak: 0.8, duration: "1.08s", delay: "-0.54s", color: "#f472b6" },
    { low: 0.14, mid: 0.62, peak: 0.86, duration: "1.42s", delay: "-0.74s", color: "#fb7185" },
    { low: 0.3, mid: 0.78, peak: 1, duration: "1.26s", delay: "-1.04s", color: "#f59e0b" },
    { low: 0.2, mid: 0.52, peak: 0.78, duration: "1.52s", delay: "-0.31s", color: "#fbbf24" },
    { low: 0.4, mid: 0.66, peak: 0.92, duration: "1.16s", delay: "-0.89s", color: "#f472b6" },
    { low: 0.12, mid: 0.48, peak: 0.72, duration: "1.68s", delay: "-1.37s", color: "#e879f9" },
    { low: 0.34, mid: 0.74, peak: 0.98, duration: "1.22s", delay: "-0.42s", color: "#c084fc" },
    { low: 0.18, mid: 0.54, peak: 0.84, duration: "1.48s", delay: "-1.08s", color: "#a855f7" },
    { low: 0.44, mid: 0.7, peak: 0.9, duration: "1.14s", delay: "-0.63s", color: "#818cf8" },
    { low: 0.26, mid: 0.6, peak: 0.88, duration: "1.58s", delay: "-1.16s", color: "#60a5fa" },
    { low: 0.16, mid: 0.46, peak: 0.7, duration: "1.34s", delay: "-0.36s", color: "#38bdf8" },
    { low: 0.38, mid: 0.72, peak: 0.96, duration: "1.2s", delay: "-0.92s", color: "#22d3ee" },
];
</script>

<template>
    <div class="music-background" aria-hidden="true">
        <div class="audio-towers">
            <span
                v-for="(bar, index) in bars"
                :key="`bar-${index}`"
                class="audio-bar"
                :style="{
                    '--bar-low': bar.low,
                    '--bar-mid': bar.mid,
                    '--bar-peak': bar.peak,
                    '--bar-duration': bar.duration,
                    '--bar-delay': bar.delay,
                    '--bar-color': bar.color,
                }"
            ></span>
        </div>
    </div>
</template>

<style>
.music-background {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    contain: paint;
    isolation: isolate;
    pointer-events: none;
    z-index: 0;
    background:
        radial-gradient(circle at 18% 24%, rgb(34 211 238 / 13%), transparent 34%),
        radial-gradient(circle at 78% 30%, rgb(168 85 247 / 17%), transparent 38%),
        radial-gradient(circle at 52% 92%, rgb(236 72 153 / 12%), transparent 42%),
        linear-gradient(145deg, #050711 0%, #0a1024 48%, #090612 100%);
}

.audio-towers {
    position: absolute;
    z-index: 1;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(4px, 0.85vw, 14px);
    width: min(92vw, 38rem);
    height: min(72.5vh, 30rem);
    opacity: 0.7;
    transform: translate(-50%, -50%);
}

.audio-bar {
    width: clamp(3px, 0.75vw, 12px);
    height: 100%;
    flex: 0 1 12px;
    border-radius: 999px 999px 0 0;
    transform: scaleY(var(--bar-low));
    transform-origin: 50% 50%;
    background: linear-gradient(
        to top,
        rgb(15 23 42 / 8%) 0%,
        color-mix(in srgb, var(--bar-color) 55%, transparent) 42%,
        var(--bar-color) 100%
    );
    animation: audio-level var(--bar-duration) cubic-bezier(0.37, 0, 0.63, 1) var(--bar-delay) infinite;
}

@keyframes audio-level {
    0%,
    100% {
        transform: scaleY(var(--bar-low));
    }
    18% {
        transform: scaleY(var(--bar-peak));
    }
    37% {
        transform: scaleY(var(--bar-mid));
    }
    57% {
        transform: scaleY(var(--bar-peak));
    }
    76% {
        transform: scaleY(var(--bar-low));
    }
    89% {
        transform: scaleY(var(--bar-mid));
    }
}

@media (max-width: 640px) {
    .audio-towers {
        gap: 4px;
        width: calc(100vw - 0.5rem);
        height: min(67.5vh, 27.5rem);
    }
}

@media (prefers-reduced-motion: reduce) {
    .audio-bar {
        animation: none;
    }
}
</style>
