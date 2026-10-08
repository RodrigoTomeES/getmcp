import { describe, it, expect } from "vitest";
import { serializeJsonLd } from "@/lib/json-ld";

describe("serializeJsonLd", () => {
  it("escapes < so the payload cannot close the script or open a comment", () => {
    const data = {
      "@type": "SoftwareApplication",
      description: "</script><script>alert(1)</script> <!-- comment",
      nested: [{ name: "a < b" }],
    };
    const out = serializeJsonLd(data);
    expect(out).not.toContain("<");
    expect(out).toContain("\\u003c/script>");
    expect(JSON.parse(out)).toEqual(data);
  });

  it("matches JSON.stringify when there is nothing to escape", () => {
    const data = { "@context": "https://schema.org", "@type": "WebSite", name: "getmcp & co" };
    expect(serializeJsonLd(data)).toBe(JSON.stringify(data));
  });
});
