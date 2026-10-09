// Compare OG images between two build outputs: size, pixel difference and a
// side-by-side PNG (old | new) per image in out/og-compare/.
// Usage: node og-compare.mjs <oldBuildDir> <newBuildDir> [relative/path.png ...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [oldDir, newDir, ...rest] = process.argv.slice(2);
if (!oldDir || !newDir) {
  console.error("Usage: node og-compare.mjs <oldBuildDir> <newBuildDir> [relative/path.png ...]");
  process.exit(1);
}
const files = rest.length
  ? rest
  : [
      "opengraph-image.png",
      "servers/github-github/opengraph-image.png",
      "servers/pretrip/opengraph-image.png",
      "category/ai/opengraph-image.png",
      "guides/cursor/opengraph-image.png",
    ];
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "out", "og-compare");
fs.mkdirSync(OUT, { recursive: true });

for (const f of files) {
  const a = fs.readFileSync(path.join(oldDir, f)),
    b = fs.readFileSync(path.join(newDir, f));
  const pa = PNG.sync.read(a),
    pb = PNG.sync.read(b);
  const same = pa.width === pb.width && pa.height === pb.height;
  const diff = same
    ? pixelmatch(pa.data, pb.data, null, pa.width, pa.height, { threshold: 0.1 })
    : NaN;
  const out = new PNG({ width: pa.width + pb.width + 16, height: Math.max(pa.height, pb.height) });
  out.data.fill(255);
  PNG.bitblt(pa, out, 0, 0, pa.width, pa.height, 0, 0);
  PNG.bitblt(pb, out, 0, 0, pb.width, pb.height, pa.width + 16, 0);
  const name = f.replace(/\/?opengraph-image\.png$/, "").replace(/\//g, "__") || "home";
  fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(out));
  const pct = same ? `${((100 * diff) / (pa.width * pa.height)).toFixed(3)}%` : "size differs";
  console.log(
    `${name.padEnd(28)} ${(a.length / 1024).toFixed(1)}KB -> ${(b.length / 1024).toFixed(1)}KB  diff(0.1): ${pct}`,
  );
}
console.log(`Side-by-side images: ${OUT}`);
