<template>
  <div
    id="p5js"
    class="absolute -z-10 h-screen w-screen flex justify-center items-center"
  >
    <img
      :src="selectedGif"
      alt="automatic selected gif from Giphy"
      class="w-full h-full object-cover"
    />
  </div>
</template>

<script setup lang="ts">
const gifList = [
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGJuczZ4MHlqb2NtYmY4MmkwZjlqNDg5dXcxZ2F1ZDlzazFhZzZtdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8UI85273lC1VzEgkyW/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDluMWdtNGd5NXdxNmRwdWZqdzAzNzhkMHJleGk3aHR1dDhyOGdrYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPAhqnqlH1FZJPG/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTU4bTA1czloa2xlaW04OWQ4b2Qxb3R5Y3p4dHZ5MWo2aGl4Y2M3NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KT8TJjAynfSBfOiK8d/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWY0NXE3bmc2YWhrdDBmMnUwdmhiaW1xdm91ZDQ2MXd5Z25wdGR5bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WWSPhALYIBk1wtIwGZ/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTUxdGM4bDNrczU3Zjl4eW82OXYwZ2F5cmtxb2hxNW9pOGRydXpxZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/0H9l3qi1tfQLCqaZt0/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2l0a3ZoZTRoNHk3YXVsZjlmazJmNWtwbTV5bHR0azl6cmk5YmtwcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3q3SUqPnxZGQpMNcjc/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTA3Nm1laDJrc3o5Z3UyMmQ4aXR5cXQ0OWxtYnZ6d2xyNnpsbWR5aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3og0IGjLXRttYbbtcc/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnN4MmdmendtcDA5ZXZldzB2bHB4Z2lxNzNkZHNkeWo1YWhjaDJ2NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3ov9jJikNnrKktK1Wg/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGY2bHZsdzAxa2xsOGR5eWV1bnJtZWQ5YmNobzJjNGlvdDM3Yzc4MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5RKNOaiojPbbMUsikF/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWRyaThqems5YzFtcTZwem5tNDNhdzM0M2J2OGZ6ejh3Mmtmd3hmYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9JxkPTP3alOykb8PmQ/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHYzZHV1eWI2bDh5ankzOTQ1cHM0eTZlcHZsZ3QyZHRmZWxxYWFobyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lKaeQAunM3hZaqsOpj/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWhyeXBheG5hNWhxbGJwM2RreHhyemppNzFqajdleXBiODF4b3UyeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2SYpZ92iLQsF6QZl5u/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzJ5bThldDZ1enY1Ym1uZ2Y4Mm93bmFiYjVqa3NtNDl3cHQ3a3lraCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bLdgTj2jCKe9Wf94Km/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXVkYnR2OWR6dGpuN3pkdWN5Zm5pbXY4MGwxaWUwZndhdjhoeHBlcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/13N0i6WUe8c5va/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExc28xa3Jma2dtdzA3NjloNmI4bWl2dTloZWprZW14MzdubWxhYzNieiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3ornkfqNPnwvTcPU4w/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2w4OG4wY2E1d29hb3l4cmR0YzZ5YzM1NW9kMGxzcTV3ODg4MmR0ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6nUWf8hShRlwgSDm/giphy.gif",
];

const selectedGif = gifList[Math.floor(Math.random() * gifList.length)];
</script>
