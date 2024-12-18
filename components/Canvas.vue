<template>
  <div id="p5js" class="absolute -z-10"></div>
</template>

<script setup>
onMounted(async () => {
  const { default: P5 } = await import("p5");

  const script = (p5) => {
    let angleSp;
    let radius = Math.max(p5.windowHeight / 5, p5.windowWidth / 5);
    let hueOffset = 0;

    p5.setup = () => {
      p5.createCanvas(p5.windowWidth, p5.windowHeight);
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      //background(0,0,0,0); //white
      p5.background(0, 0, 0, 100); //black
      p5.strokeWeight(3);
    };

    p5.draw = () => {
      p5.background(0, 0, 0, 100); //black
      p5.translate(p5.width / 2, p5.height / 2);
      angleSp = p5.float((p5.frameCount / 200.0) * p5.TWO_PI);
      p5.rotate(-p5.HALF_PI);

      for (let i = 0; i < 360; i += 5) {
        let x = p5.float(p5.cos(p5.radians(i)) * radius * 1.5);
        let y = p5.float(p5.sin(p5.radians(i)) * radius * 1.5);
        //stroke((i+hueOffset)%360, 60, 90, 100);
        p5.stroke((i + hueOffset) % 360, 30, 60, 100);
        p5.shape(x, y, p5.HALF_PI + p5.radians(i), 8);
      }

      for (let i = 0; i < 360; i += 10) {
        let x = p5.float(p5.cos(p5.radians(i)) * radius);
        let y = p5.float(p5.sin(p5.radians(i)) * radius);
        //stroke((i+hueOffset)%360, 60, 90, 100);
        p5.stroke((i + hueOffset) % 360, 60, 90, 100);
        p5.shape(x, y, p5.HALF_PI + p5.radians(i), 5);
      }

      for (let i = 0; i < 360; i += 15) {
        let x = p5.float(p5.cos(p5.radians(i)) * radius * 0.4);
        let y = p5.float(p5.sin(p5.radians(i)) * radius * 0.4);
        p5.stroke((i + hueOffset + 180) % 360, 100, 100, 100);
        p5.shape(x, y, p5.HALF_PI + p5.radians(i), 3);
      }
      hueOffset++;
    };

    p5.shape = (xPos, yPos, a, m) => {
      p5.push();
      p5.translate(xPos, yPos);
      p5.rotate(a);
      let offSet = p5.float(a * m);
      let pos = p5.float(p5.map(p5.cos(-angleSp + offSet), -1, 1, -100, 100));
      p5.line(0, 0, 0, 0 + pos);
      p5.pop();
    };

    p5.windowResized = () => {
      p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    };
  };
  // Attach the canvas to the div
  const p5canvas = new P5(script, "p5js");
});
</script>
