import { describe, it, expect } from "vitest";
import { getAllServers } from "@getmcp/registry";
import { createServerOGImage } from "@/lib/og-server";
import { DOCS_OG } from "@/lib/og-pages";
import { addOGGlow } from "@/lib/og-image";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function expectPng(png: Uint8Array) {
  expect(Array.from(png.subarray(0, 8))).toEqual(PNG_SIGNATURE);
  // IHDR width and height (big-endian) live at bytes 16-23.
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  expect(view.getUint32(16)).toBe(1200);
  expect(view.getUint32(20)).toBe(630);
}

describe("addOGGlow", () => {
  const background = '<rect x="0" y="0" width="1200" height="630" fill="#0a0a0a"/>';

  it("inserts the glow right after the root background", () => {
    const svg = addOGGlow(`<svg>${background}<path d="M0 0"/></svg>`);
    expect(svg.indexOf("og-glow")).toBeGreaterThan(svg.indexOf(background));
    expect(svg.indexOf("og-glow")).toBeLessThan(svg.indexOf("<path"));
  });

  it("throws when the root background is missing", () => {
    expect(() => addOGGlow("<svg></svg>")).toThrow(/background rect/);
  });
});

describe("OG images", () => {
  it("renders a page OG image", async () => {
    expectPng(await DOCS_OG.render());
  });

  it("renders a server OG image, including CJK and Hebrew text", async () => {
    const server = getAllServers()[0];
    expectPng(await createServerOGImage(server));
    expectPng(
      await createServerOGImage({
        ...server,
        name: "测试服务器",
        description: "日本語の説明 한국어 עברית",
      }),
    );
  });
});
