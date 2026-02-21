import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/core", "packages/generators", "packages/registry", "packages/cli"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["packages/web/**"],
    },
  },
});
