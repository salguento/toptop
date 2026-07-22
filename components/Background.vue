<script setup lang="ts">
const bars = [
    { low: 0.18, mid: 0.48, peak: 0.76, duration: "1.73s", delay: "-1.05s", color: "#22d3ee" },
    { low: 0.32, mid: 0.72, peak: 0.94, duration: "1.4s", delay: "-0.31s", color: "#38bdf8" },
    { low: 0.12, mid: 0.44, peak: 0.68, duration: "1.95s", delay: "-1.4s", color: "#60a5fa" },
    { low: 0.42, mid: 0.68, peak: 0.88, duration: "1.55s", delay: "-0.85s", color: "#818cf8" },
    { low: 0.24, mid: 0.58, peak: 0.82, duration: "2.15s", delay: "-1.64s", color: "#8b5cf6" },
    { low: 0.36, mid: 0.76, peak: 1, duration: "1.48s", delay: "-0.58s", color: "#a855f7" },
    { low: 0.16, mid: 0.5, peak: 0.74, duration: "1.83s", delay: "-1.2s", color: "#c084fc" },
    { low: 0.46, mid: 0.64, peak: 0.9, duration: "1.63s", delay: "-0.21s", color: "#d946ef" },
    { low: 0.22, mid: 0.7, peak: 0.96, duration: "2.03s", delay: "-1.53s", color: "#e879f9" },
    { low: 0.38, mid: 0.56, peak: 0.8, duration: "1.35s", delay: "-0.68s", color: "#f472b6" },
    { low: 0.14, mid: 0.62, peak: 0.86, duration: "1.78s", delay: "-0.93s", color: "#fb7185" },
    { low: 0.3, mid: 0.78, peak: 1, duration: "1.58s", delay: "-1.3s", color: "#f59e0b" },
    { low: 0.2, mid: 0.52, peak: 0.78, duration: "1.9s", delay: "-0.39s", color: "#fbbf24" },
    { low: 0.4, mid: 0.66, peak: 0.92, duration: "1.45s", delay: "-1.11s", color: "#f472b6" },
    { low: 0.12, mid: 0.48, peak: 0.72, duration: "2.1s", delay: "-1.71s", color: "#e879f9" },
    { low: 0.34, mid: 0.74, peak: 0.98, duration: "1.53s", delay: "-0.53s", color: "#c084fc" },
    { low: 0.18, mid: 0.54, peak: 0.84, duration: "1.85s", delay: "-1.35s", color: "#a855f7" },
    { low: 0.44, mid: 0.7, peak: 0.9, duration: "1.43s", delay: "-0.79s", color: "#818cf8" },
    { low: 0.26, mid: 0.6, peak: 0.88, duration: "1.98s", delay: "-1.45s", color: "#60a5fa" },
    { low: 0.16, mid: 0.46, peak: 0.7, duration: "1.68s", delay: "-0.45s", color: "#38bdf8" },
    { low: 0.38, mid: 0.72, peak: 0.96, duration: "1.5s", delay: "-1.15s", color: "#22d3ee" },
];

const getColorDuration = (duration: string) =>
    `${(Number.parseFloat(duration) * 6).toFixed(2)}s`;

const getColorDelay = (delay: string, index: number) =>
    `${(Number.parseFloat(delay) * 3 - index * 0.18).toFixed(2)}s`;
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
                    '--color-duration': getColorDuration(bar.duration),
                    '--color-delay': getColorDelay(bar.delay, index),
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
    height: min(108.75vh, 45rem);
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
    animation:
        audio-level var(--bar-duration) cubic-bezier(0.37, 0, 0.63, 1) var(--bar-delay) infinite,
        bar-color-flow var(--color-duration) cubic-bezier(0.45, 0, 0.55, 1) var(--color-delay) infinite alternate;
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

@keyframes bar-color-flow {
    0% {
        filter: hue-rotate(-18deg) saturate(0.94) brightness(0.92);
    }
    28% {
        filter: hue-rotate(32deg) saturate(1.12) brightness(1.06);
    }
    54% {
        filter: hue-rotate(94deg) saturate(0.98) brightness(0.96);
    }
    78% {
        filter: hue-rotate(164deg) saturate(1.14) brightness(1.08);
    }
    100% {
        filter: hue-rotate(248deg) saturate(1.02) brightness(0.94);
    }
}

@media (max-width: 640px) {
    .audio-towers {
        gap: 4px;
        width: calc(100vw - 0.5rem);
        height: min(101.25vh, 41.25rem);
    }
}

@media (prefers-reduced-motion: reduce) {
    .audio-bar {
        animation: none;
    }
}
</style>
