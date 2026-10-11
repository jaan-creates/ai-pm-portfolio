import { describe, expect, it } from "vitest";
import { deriveSuggestedTags, extractLinkMetadata, isSafePublicUrl } from "./link-enrichment";

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

  it("uses a deterministic YouTube thumbnail when metadata is absent", () => {
    expect(extractLinkMetadata("", "https://youtu.be/abc123?t=4").imageUrl)
      .toBe("https://img.youtube.com/vi/abc123/hqdefault.jpg");
  });

  it("derives conservative source and topic tags", () => {
    expect(deriveSuggestedTags("https://www.instagram.com/reel/example", "Oats sandwich workout", "Quick recipe"))
      .toEqual(["Instagram Reel", "recipe", "fitness"]);
  });

  it("rejects local and private destinations", () => {
    expect(isSafePublicUrl("http://localhost:3000")).toBe(false);
    expect(isSafePublicUrl("http://192.168.1.20/item")).toBe(false);
    expect(isSafePublicUrl("https://github.com/item")).toBe(true);
    expect(isSafePublicUrl("https://example.com/item")).toBe(false);
  });
});
