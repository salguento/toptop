<template>
  <div id="canvas"></div>
</template>

<script setup>
const props = defineProps({
  colors: {
    type: Array,
    default: [],
  },
});

async () => {
  const { default: P5 } = await import("p5");

  const script = (p5) => {
    // These are your typical setup() and draw() methods
    p5.setup = () => {
      p5.createCanvas(1080, 1920);
    };
    p5.draw = () => {
      p5.clear();
      p5.background(colors[0].red, colors[0].green, colors[0].blue);
    };
  };
  // Attach the canvas to the div
  const p5canvas = new P5(script, "canvas");
};

console.log(colors);
</script>
