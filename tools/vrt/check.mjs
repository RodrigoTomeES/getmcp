// Smoke checks on a served build (no bypassCSP here, so CSP violations show up):
// console errors and CSP violations per page, a scan for `space-y-*` containers whose
// last visible child gets a margin because trailing <script> siblings follow it, and a
// few interactions (config tabs, /servers search, mobile filters dialog).
// Usage: node check.mjs <baseUrl>   e.g. node check.mjs http://localhost:4600
import { chromium } from "playwright";

const base = process.argv[2];
if (!base) {
  console.error("Usage: node check.mjs <baseUrl>");
  process.exit(1);
}
const PAGES = [
  "/",
  "/servers",
  "/servers/github-github",
  "/servers/pretrip",
  "/category/ai",
  "/category/ai/2",
  "/guides",
  "/guides/cursor",
  "/docs",
  "/this-page-does-not-exist-vrt",
];

const browser = await chromium.launch();
try {
  for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error" && !/status of 404/.test(m.text()))
        errors.push(m.text().slice(0, 160));
    });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));
    const resp = await page.goto(base + p, { waitUntil: "networkidle" });
    const info = await page.evaluate(() => {
      const spaceLeaks = [...document.querySelectorAll('[class*="space-y-"]')].flatMap((el) => {
        const kids = [...el.children];
        const lastVisible = kids.filter((k) => k.getBoundingClientRect().height > 0).at(-1);
        if (!lastVisible) return [];
        const trailing = kids.slice(kids.indexOf(lastVisible) + 1);
        const mb = parseFloat(getComputedStyle(lastVisible).marginBottom);
        return trailing.length && mb > 0
          ? [
              `${el.className.match(/space-y-\S+/)[0]}: <${lastVisible.tagName.toLowerCase()}> gets ${mb}px (trailing ${trailing.map((t) => t.tagName.toLowerCase()).join(",")})`,
            ]
          : [];
      });
      return {
        h1: document.querySelectorAll("h1").length,
        islands: document.querySelectorAll("astro-island").length,
        csp: !!document.querySelector('meta[http-equiv="content-security-policy"]'),
        htmlKB: Math.round(document.documentElement.outerHTML.length / 1024),
        spaceLeaks,
      };
    });
    const flags = [
      errors.length ? `ERRORS: ${errors.join(" || ")}` : "",
      info.spaceLeaks.length ? `SPACE-Y: ${info.spaceLeaks.join(" | ")}` : "",
    ]
      .filter(Boolean)
      .join("  ");
    console.log(
      `${p.padEnd(30)} ${resp.status()} h1=${info.h1} islands=${info.islands} csp=${info.csp} html=${info.htmlKB}KB ${flags || "ok"}`,
    );
    await ctx.close();
  }

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/servers/github-github`, { waitUntil: "networkidle" });
  await page.locator("label", { hasText: "Cursor" }).first().click();
  const panel = await page.evaluate(() =>
    [...document.querySelectorAll("[data-panel], [role=tabpanel]")]
      .find((e) => !e.hidden && e.offsetParent)
      ?.textContent.trim()
      .slice(0, 80),
  );
  console.log("config tabs (clicked Cursor):", panel ?? "NO VISIBLE PANEL");
  await page.goto(`${base}/servers?q=github`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  console.log(
    "/servers?q=github cards:",
    await page.locator("main a[href^='/servers/']").count(),
    "url:",
    page.url().replace(base, ""),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/servers`, { waitUntil: "networkidle" });
  const filters = page.getByRole("button", { name: /filter/i }).first();
  if (await filters.count()) {
    await filters.click();
    await page.waitForTimeout(300);
    console.log(
      "mobile filters dialog open:",
      await page.evaluate(() => !!document.querySelector("dialog[open]")),
    );
  }
  await ctx.close();
} finally {
  await browser.close();
}
