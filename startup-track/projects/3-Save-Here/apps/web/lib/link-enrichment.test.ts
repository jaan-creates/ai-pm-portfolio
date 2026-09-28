import { describe, expect, it } from "vitest";
import { extractLinkMetadata, isSafePublicUrl } from "./link-enrichment";

describe("deterministic link enrichment", () => {
  it("extracts Open Graph metadata and resolves relative images", () => {
    const result = extractLinkMetadata(
      '<html><head><title>Fallback title</title><meta property="og:title" content="Recipe video"><meta property="og:description" content="A quick dinner"><meta property="og:image" content="/thumb.jpg"></head></html>',
      "https://example.com/watch",
    );
    expect(result).toEqual({
      title: "Recipe video",
      description: "A quick dinner",
      imageUrl: "https://example.com/thumb.jpg",
    });
  });

  it("rejects local and private destinations", () => {
    expect(isSafePublicUrl("http://localhost:3000")).toBe(false);
    expect(isSafePublicUrl("http://192.168.1.20/item")).toBe(false);
    expect(isSafePublicUrl("https://github.com/item")).toBe(true);
    expect(isSafePublicUrl("https://example.com/item")).toBe(false);
  });
});
