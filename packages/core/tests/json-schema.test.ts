import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { getRegistryEntryJsonSchema } from "../src/json-schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("getRegistryEntryJsonSchema", () => {
  const schema = getRegistryEntryJsonSchema();

  it("returns a valid JSON Schema object", () => {
    expect(schema.type).toBe("object");
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
  });

  it("includes required properties", () => {
    expect(schema.required).toContain("server");
  });

  it("includes optional fields in properties", () => {
    const props = schema.properties as Record<string, unknown>;
    expect(props).toHaveProperty("server");
    expect(props).toHaveProperty("_meta");
  });

  it("static file matches runtime output", () => {
    const staticPath = path.resolve(__dirname, "..", "registry-entry.schema.json");
    const staticContent = JSON.parse(fs.readFileSync(staticPath, "utf-8"));
    expect(staticContent).toEqual(schema);
  });
});
