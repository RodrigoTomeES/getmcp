/**
 * Generate the raster icons (favicon.ico, apple-touch-icon.png, icon-192.png,
 * icon-512.png) from public/icon.svg: the glyph at 75% size on a full-bleed
 * #0a0a0a square, so the icons stay legible on any launcher or tab background.
 *
 * Run with `npx tsx packages/web/scripts/generate-icons.ts` after changing
 * public/icon.svg, and commit the generated files.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const PUBLIC = join(import.meta.dirname, "..", "public");
const BACKGROUND = "#0a0a0a";

const source = readFileSync(join(PUBLIC, "icon.svg"), "utf8");
const inner = source.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${BACKGROUND}"/><g transform="translate(4 4) scale(0.75)">${inner}</g></svg>`;

function render(size: number): Buffer {
  return new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
}

/** Wrap one PNG in a single-entry ICO container (PNG-in-ICO, Vista+). */
function toIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette colours
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image size
  entry.writeUInt32LE(header.length + entry.length, 12); // image offset (22)
  return Buffer.concat([header, entry, png]);
}

writeFileSync(join(PUBLIC, "favicon.ico"), toIco(render(32), 32));
writeFileSync(join(PUBLIC, "apple-touch-icon.png"), render(180));
writeFileSync(join(PUBLIC, "icon-192.png"), render(192));
writeFileSync(join(PUBLIC, "icon-512.png"), render(512));
console.log("Wrote favicon.ico, apple-touch-icon.png, icon-192.png and icon-512.png");
