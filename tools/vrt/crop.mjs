// Side-by-side crop of the same region from several screenshots (e.g. baseline | candidate | diff).
// Usage: node crop.mjs <out.png> <x> <y> <width> <height> <img1.png> <img2.png> [img3.png ...]
import fs from "node:fs";
import { PNG } from "pngjs";

const [out, x, y, w, h, ...imgs] = process.argv.slice(2);
if (!out || imgs.length < 1) {
  console.error(
    "Usage: node crop.mjs <out.png> <x> <y> <width> <height> <img1.png> [img2.png ...]",
  );
  process.exit(1);
}
const [X, Y, W, H] = [x, y, w, h].map(Number);
const GAP = 8;
const res = new PNG({ width: W * imgs.length + GAP * (imgs.length - 1), height: H });
for (let i = 0; i < res.data.length; i += 4) {
  res.data[i] = res.data[i + 1] = res.data[i + 2] = 38;
  res.data[i + 3] = 255;
}
imgs.forEach((f, i) => {
  const s = PNG.sync.read(fs.readFileSync(f));
  const cw = Math.max(0, Math.min(W, s.width - X)),
    ch = Math.max(0, Math.min(H, s.height - Y));
  if (cw && ch) PNG.bitblt(s, res, X, Y, cw, ch, i * (W + GAP), 0);
});
fs.writeFileSync(out, PNG.sync.write(res));
console.log(`Wrote ${out}`);
