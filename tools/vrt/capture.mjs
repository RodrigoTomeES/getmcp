// Full-page screenshots + DOM/style fingerprints + OG images for every target page.
// Usage: node capture.mjs <label> <baseUrl> [--only <regex>]
//   e.g. node capture.mjs prod https://getmcp.es
//        node capture.mjs head http://localhost:4600
// Output: out/<label>/<page>.<viewport>.png|json and <page>.og.png
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TARGETS, VIEWPORTS, fileStem } from "./targets.mjs";

const args = process.argv.slice(2);
const [label, base] = args;
if (!label || !base) {
  console.error("Usage: node capture.mjs <label> <baseUrl> [--only <regex>]");
  process.exit(1);
}
const onlyIdx = args.indexOf("--only");
const only = onlyIdx > -1 ? new RegExp(args[onlyIdx + 1]) : null;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "out", label);
await fs.mkdir(OUT, { recursive: true });

const KEY_SELECTORS = [
  "body",
  "header",
  "nav",
  "main",
  "footer",
  "h1",
  "h2",
  "h3",
  "main p",
  "main a",
  "button",
  "input",
  "pre",
  "code",
  "[role=tab]",
  "table",
  "li",
  "img",
  "svg",
];
const STYLE_PROPS = [
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "color",
  "background-color",
  "padding",
  "margin",
  "gap",
  "border-width",
  "border-color",
  "border-radius",
  "display",
  "max-width",
  "width",
  "height",
  "text-transform",
  "box-shadow",
  "opacity",
];
const NO_MOTION =
  "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";

const browser = await chromium.launch();
const ogSeen = new Map();
try {
  for (const [vpName, vpOpts] of Object.entries(VIEWPORTS)) {
    // bypassCSP: the site's CSP (correctly) blocks the injected no-motion <style>.
    const ctx = await browser.newContext({
      ...vpOpts,
      bypassCSP: true,
      colorScheme: "dark",
      locale: "en-US",
      timezoneId: "UTC",
      reducedMotion: "reduce",
    });
    await ctx.route(
      /cloudflareinsights|_vercel\/(insights|speed-insights)|vercel-scripts|googletagmanager/,
      (r) => r.abort(),
    );
    const page = await ctx.newPage();
    for (const p of TARGETS) {
      if (only && !only.test(p)) continue;
      const id = `${fileStem(p)}.${vpName}`;
      try {
        const resp = await page.goto(base + p, { waitUntil: "networkidle", timeout: 60000 });
        await page.addStyleTag({ content: NO_MOTION });
        // Scroll through the page to trigger lazy content, then back to the top.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 40));
          }
          window.scrollTo(0, 0);
        });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT, `${id}.png`), fullPage: true });
        const info = await page.evaluate(
          ({ KEY_SELECTORS, STYLE_PROPS }) => {
            const visible = (el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            };
            const meta = {};
            for (const m of document.querySelectorAll("meta[name],meta[property]"))
              meta[m.getAttribute("name") || m.getAttribute("property")] =
                m.getAttribute("content");
            const styles = {};
            for (const sel of KEY_SELECTORS) {
              styles[sel] = [...document.querySelectorAll(sel)]
                .filter(visible)
                .slice(0, 4)
                .map((el) => {
                  const cs = getComputedStyle(el);
                  const r = el.getBoundingClientRect();
                  const o = {
                    text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 60),
                    box: [
                      Math.round(r.x),
                      Math.round(r.y + scrollY),
                      Math.round(r.width),
                      Math.round(r.height),
                    ],
                  };
                  for (const k of STYLE_PROPS) o[k] = cs.getPropertyValue(k);
                  return o;
                });
            }
            return {
              title: document.title,
              meta,
              canonical: document.querySelector("link[rel=canonical]")?.href ?? null,
              icons: [...document.querySelectorAll("link[rel*=icon]")].map(
                (l) => `${l.getAttribute("rel")} ${l.getAttribute("sizes")}`,
              ),
              jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
                (s) => s.textContent,
              ),
              height: document.documentElement.scrollHeight,
              width: document.documentElement.scrollWidth,
              counts: Object.fromEntries(
                [
                  "a",
                  "img",
                  "svg",
                  "button",
                  "h1",
                  "h2",
                  "h3",
                  "pre",
                  "input",
                  "li",
                  "[role=tab]",
                  "section",
                  "article",
                ].map((s) => [s, document.querySelectorAll(s).length]),
              ),
              headings: [...document.querySelectorAll("h1,h2,h3")].map(
                (h) => `${h.tagName}: ${h.innerText.trim().slice(0, 80)}`,
              ),
              links: [...document.querySelectorAll("a[href]")]
                .map((a) => a.getAttribute("href"))
                .slice(0, 400),
              text: document.body.innerText.replace(/\s+/g, " ").slice(0, 20000),
              styles,
            };
          },
          { KEY_SELECTORS, STYLE_PROPS },
        );
        info.status = resp?.status();
        await fs.writeFile(path.join(OUT, `${id}.json`), JSON.stringify(info, null, 1));
        // OG image, once per page, always fetched from the site under test.
        const og = info.meta["og:image"];
        if (og && !ogSeen.has(p)) {
          ogSeen.set(p, og);
          const u = new URL(og, base);
          const r = await ctx.request.get(new URL(u.pathname + u.search, base).href);
          await fs.writeFile(path.join(OUT, `${fileStem(p)}.og.png`), await r.body());
        }
        console.log("ok", id, info.status, info.height);
      } catch (e) {
        console.log("FAIL", id, e.message.split("\n")[0]);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
