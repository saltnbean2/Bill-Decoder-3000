// Renders the app icon (teal tile with a white spark) to the PNG sizes phones need.
// Run: node scripts/make-icons.mjs
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0F766E"/>
  <g transform="translate(256 256) scale(${pad})">
    <path d="M0 -150 C 18 -50 50 -18 150 0 C 50 18 18 50 0 150 C -18 50 -50 18 -150 0 C -50 -18 -18 -50 0 -150 Z" fill="#FAF8F5"/>
  </g>
</svg>`;

const out = [
  ["app/apple-icon.png", 180, 1],
  ["public/icon-192.png", 192, 1],
  ["public/icon-512.png", 512, 1],
  ["public/icon-maskable-512.png", 512, 0.72], // extra safe zone for Android's round masks
];
const b = await chromium.launch();
const p = await b.newPage();
for (const [file, size, pad] of out) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<body style="margin:0">${svg(pad).replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
  await p.screenshot({ path: path.join(root, file), omitBackground: false });
  console.log("wrote", file);
}
await b.close();
