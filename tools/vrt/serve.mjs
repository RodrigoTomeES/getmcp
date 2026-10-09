// Minimal static server for an Astro build output (build.format: "file":
// /servers/foo -> servers/foo.html). Unknown paths serve 404.html with status 404.
// Usage: node serve.mjs <buildDir> [port]   (default port 4600). Stop it with Ctrl+C.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const [root, port = "4600"] = process.argv.slice(2);
if (!root || !fs.existsSync(root)) {
  console.error("Usage: node serve.mjs <buildDir> [port]");
  process.exit(1);
}
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

http
  .createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(root, p);
    if (p.endsWith("/")) file = path.join(file, "index.html");
    else if (!path.extname(p)) file += ".html";
    if (!fs.existsSync(file)) {
      res.writeHead(404, { "content-type": "text/html" });
      return res.end(fs.readFileSync(path.join(root, "404.html")));
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    res.end(fs.readFileSync(file));
  })
  .listen(Number(port), () => console.log(`Serving ${root} on http://localhost:${port}`));
