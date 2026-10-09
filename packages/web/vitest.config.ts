import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

export default defineProject({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    name: "web",
    include: ["tests/**/*.test.{ts,tsx}"],
    // OG rendering loads ~23 MB of fonts on first use.
    testTimeout: 60_000,
    env: { GETMCP_WEB_ASSETS_DIR: fileURLToPath(new URL("./assets", import.meta.url)) },
  },
});
