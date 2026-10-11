import { describe, expect, it } from "vitest";
import { buildEvidenceUnderstanding } from "./evidence-understanding";

describe("buildEvidenceUnderstanding", () => {
  it("turns OCR into a concise summary, tags, and searchable text", () => {
    const result = buildEvidenceUnderstanding({
      role: "screenshot",
      mimeType: "image/png",
      extractedText: "High protein oats recipe for breakfast with banana",
    }, "2026-10-11T00:00:00.000Z");

    expect(result.summary).toContain("High protein oats");
    expect(result.suggestedTags).toEqual(expect.arrayContaining(["protein", "oats", "recipe"]));
    expect(result.searchableText).toContain("banana");
    expect(result.provenance).toEqual({ source: "ocr", confidence: 0.8, extractedAt: "2026-10-11T00:00:00.000Z" });
  });

  it("keeps vision labels explainable when OCR is unavailable", () => {
    const result = buildEvidenceUnderstanding({
      role: "image",
      mimeType: "image/jpeg",
      visualLabels: ["Food", "Fitness", "Food"],
    });

    expect(result.summary).toBe("food · fitness");
    expect(result.suggestedTags).toEqual(["food", "fitness"]);
    expect(result.provenance.source).toBe("vision");
  });

  it("does not invent meaning for a blank restricted asset", () => {
    const result = buildEvidenceUnderstanding({ role: "recording", mimeType: "video/mp4" });
    expect(result.summary).toBeNull();
    expect(result.suggestedTags).toEqual([]);
    expect(result.searchableText).toBe("");
    expect(result.provenance.source).toBe("none");
    expect(result.provenance.extractedAt).toBeNull();
  });
});
