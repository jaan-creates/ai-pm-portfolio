import { describe, expect, it } from "vitest";
import { expectedAssetPath, validateUploadRequest } from "./asset-upload";

describe("evidence upload validation", () => {
  it("accepts a screenshot within the pilot limit", () => {
    expect(validateUploadRequest({
      item_id: "item-1",
      role: "screenshot",
      mime_type: "image/jpeg",
      byte_size: 1024,
    }).ok).toBe(true);
  });

  it("rejects executable and oversized uploads", () => {
    expect(validateUploadRequest({
      item_id: "item-1",
      role: "screenshot",
      mime_type: "application/javascript",
      byte_size: 1024,
    }).ok).toBe(false);
    expect(validateUploadRequest({
      item_id: "item-1",
      role: "video",
      mime_type: "video/mp4",
      byte_size: 100 * 1024 * 1024 + 1,
    }).ok).toBe(false);
  });

  it("keeps evidence paths scoped to the owner and item", () => {
    expect(expectedAssetPath("owner", "item", "asset")).toBe("owner/item/asset");
  });
});
