// Compare two captures (see capture.mjs): pixel diff per page + DOM/meta/style diff.
// Usage: node compare.mjs <baselineLabel> <candidateLabel>
//   e.g. node compare.mjs prod head
// Output: out/diff-<candidate>/<page>.png (red = different, magenta = missing area),
//         out/summary-<candidate>.json, and a table sorted by pixel difference.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [baseLabel, candLabel] = process.argv.slice(2);
if (!baseLabel || !candLabel) {
  console.error("Usage: node compare.mjs <baselineLabel> <candidateLabel>");
  process.exit(1);
}
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "out");
const A = path.join(OUT, baseLabel),
  B = path.join(OUT, candLabel),
  D = path.join(OUT, `diff-${candLabel}`);
await fs.mkdir(D, { recursive: true });

const readPng = async (f) => PNG.sync.read(await fs.readFile(f));
function pad(img, w, h) {
  if (img.width === w && img.height === h) return img;
  const out = new PNG({ width: w, height: h });
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 255;
    out.data[i + 2] = 255;
    out.data[i + 3] = 255;
  } // magenta
  PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
  return out;
}
async function diffImages(fa, fb, fd) {
  const a = await readPng(fa),
    b = await readPng(fb);
  const w = Math.max(a.width, b.width),
    h = Math.max(a.height, b.height);
  const out = new PNG({ width: w, height: h });
  const n = pixelmatch(pad(a, w, h).data, pad(b, w, h).data, out.data, w, h, {
    threshold: 0.1,
    alpha: 0.2,
  });
  await fs.writeFile(fd, PNG.sync.write(out));
  // Rows (in 50 px bands) with the most differing pixels: where to look first.
  const bands = {};
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (out.data[i] === 255 && out.data[i + 1] === 0 && out.data[i + 2] === 0)
        bands[Math.floor(y / 50) * 50] = (bands[Math.floor(y / 50) * 50] ?? 0) + 1;
    }
  const hot = Object.entries(bands)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([y]) => Number(y))
    .sort((x, y) => x - y);
  return {
    pct: +((100 * n) / (w * h)).toFixed(3),
    pixels: n,
    sizeA: [a.width, a.height],
    sizeB: [b.width, b.height],
    hotBandsY: hot,
  };
}
const setDiff = (x, y) => {
  const s = new Set(y);
  return [...new Set(x)].filter((v) => !s.has(v));
};
const words = (t) => t.toLowerCase().match(/[a-z0-9][a-z0-9.\-_/]+/g) ?? [];

function domDiff(a, b) {
  const d = {};
  if (a.status !== b.status) d.status = [a.status, b.status];
  if (a.title !== b.title) d.title = [a.title, b.title];
  if (a.canonical !== b.canonical) d.canonical = [a.canonical, b.canonical];
  const meta = {};
  for (const k of new Set([...Object.keys(a.meta), ...Object.keys(b.meta)])) {
    // OG image URLs differ between hosts/frameworks; only report presence changes.
    if (/og:image$|twitter:image$|og:image:url/.test(k)) {
      if (!!a.meta[k] !== !!b.meta[k]) meta[k] = [a.meta[k], b.meta[k]];
      continue;
    }
    if (a.meta[k] !== b.meta[k]) meta[k] = [a.meta[k], b.meta[k]];
  }
  if (Object.keys(meta).length) d.meta = meta;
  if (JSON.stringify(a.icons) !== JSON.stringify(b.icons)) d.icons = [a.icons, b.icons];
  if (
    JSON.stringify(a.jsonld.map((j) => j.replace(/\s/g, ""))) !==
    JSON.stringify(b.jsonld.map((j) => j.replace(/\s/g, "")))
  )
    d.jsonld = true;
  if (Math.abs(a.height - b.height) > 2) d.height = [a.height, b.height];
  if (a.width !== b.width) d.scrollWidth = [a.width, b.width];
  const counts = {};
  for (const k of Object.keys(a.counts))
    if (a.counts[k] !== b.counts[k]) counts[k] = [a.counts[k], b.counts[k]];
  if (Object.keys(counts).length) d.counts = counts;
  const hA = setDiff(a.headings, b.headings),
    hB = setDiff(b.headings, a.headings);
  if (hA.length || hB.length) d.headings = { onlyBaseline: hA, onlyCandidate: hB };
  const lA = setDiff(a.links, b.links),
    lB = setDiff(b.links, a.links);
  if (lA.length || lB.length)
    d.links = { onlyBaseline: lA.slice(0, 20), onlyCandidate: lB.slice(0, 20) };
  const wA = setDiff(words(a.text), words(b.text)),
    wB = setDiff(words(b.text), words(a.text));
  if (wA.length || wB.length)
    d.text = { onlyBaseline: wA.slice(0, 40), onlyCandidate: wB.slice(0, 40) };
  const styles = [];
  for (const sel of Object.keys(a.styles)) {
    const ea = a.styles[sel],
      eb = b.styles[sel] ?? [];
    if (ea.length !== eb.length)
      styles.push({ sel, note: `visible count ${ea.length} vs ${eb.length}` });
    for (let i = 0; i < Math.min(ea.length, eb.length); i++) {
      const props = {};
      for (const k of Object.keys(ea[i]))
        if (k !== "text" && k !== "box" && JSON.stringify(ea[i][k]) !== JSON.stringify(eb[i][k]))
          props[k] = [ea[i][k], eb[i][k]];
      if (Object.keys(props).length) styles.push({ sel, i, text: ea[i].text, props });
    }
  }
  if (styles.length) d.styles = styles;
  return d;
}

const summary = [];
for (const f of (await fs.readdir(A)).filter((f) => f.endsWith(".png"))) {
  const fb = path.join(B, f);
  try {
    await fs.access(fb);
  } catch {
    summary.push({ id: f, missingInCandidate: true });
    continue;
  }
  const r = {
    id: f.replace(/\.png$/, ""),
    pixel: await diffImages(path.join(A, f), fb, path.join(D, f)),
  };
  if (!f.includes(".og.")) {
    const ja = JSON.parse(await fs.readFile(path.join(A, f.replace(".png", ".json")), "utf8"));
    const jb = JSON.parse(await fs.readFile(path.join(B, f.replace(".png", ".json")), "utf8"));
    r.dom = domDiff(ja, jb);
  }
  summary.push(r);
}
await fs.writeFile(path.join(OUT, `summary-${candLabel}.json`), JSON.stringify(summary, null, 1));

const rows = summary.filter((r) => r.pixel).sort((x, y) => y.pixel.pct - x.pixel.pct);
console.log(
  `${"page".padEnd(42)} ${"diff %".padStart(7)}  ${"height".padStart(15)}  hot rows (y)      dom changes`,
);
for (const r of rows) {
  const height = `${r.pixel.sizeA[1]}→${r.pixel.sizeB[1]}`;
  const dom = r.dom ? Object.keys(r.dom).join(",") : "";
  console.log(
    `${r.id.padEnd(42)} ${String(r.pixel.pct).padStart(7)}  ${height.padStart(15)}  ${r.pixel.hotBandsY.join(",").padEnd(16)}  ${dom}`,
  );
}
const missing = summary.filter((r) => r.missingInCandidate);
if (missing.length)
  console.log(`\nMissing in ${candLabel}: ${missing.map((r) => r.id).join(", ")}`);
console.log(`\nDiff images: ${D}\nSummary: ${path.join(OUT, `summary-${candLabel}.json`)}`);
