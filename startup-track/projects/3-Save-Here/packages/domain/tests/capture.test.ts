import { describe, expect, it } from "vitest";
import { captureInputSchema, inferContentType, normalizeUrl } from "../src/index";

const base = {
  capture_id: "8fe96c4e-e423-4ea5-b83b-e35680408b0b",
  device: {
    id: "e7226448-0041-44e8-9782-54af4a85142e",
    shortcut_version: "1.0.0",
  },
};

describe("captureInputSchema", () => {
  it("accepts a valid URL capture without a note", () => {
    const result = captureInputSchema.safeParse({
      ...base,
      input_type: "url",
      shared_url: "https://www.instagram.com/reel/example/",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a URL capture without a URL", () => {
    const result = captureInputSchema.safeParse({ ...base, input_type: "url" });
    expect(result.success).toBe(false);
  });

  it("accepts a text capture", () => {
    const result = captureInputSchema.safeParse({
      ...base,
      input_type: "text",
      shared_text: "Gift idea for the dinner party",
    });
    expect(result.success).toBe(true);
  });
});

describe("normalizeUrl", () => {
  it("strips fragments and tracking parameters", () => {
    expect(
      normalizeUrl("https://Example.com/story/?utm_source=feed&keep=yes#comments"),
    ).toBe("https://example.com/story?keep=yes");
  });

  it("normalizes Twitter links to X", () => {
    expect(normalizeUrl("https://twitter.com/user/status/123?s=20")).toBe(
      "https://x.com/user/status/123",
    );
  });
});

describe("inferContentType", () => {
  it("recognizes Instagram reels", () => {
    expect(inferContentType("https://www.instagram.com/reel/example")).toBe("instagram_reel");
  });
});
