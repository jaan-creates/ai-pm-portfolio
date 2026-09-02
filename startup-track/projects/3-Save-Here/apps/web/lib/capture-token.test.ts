import { describe, expect, it } from "vitest";
import { constantTimeEqual, readBearerToken, tokenDigest } from "./capture-token";

describe("capture token helpers", () => {
  it("creates stable peppered digests", () => {
    const digest = tokenDigest("a".repeat(32), "pepper".repeat(8));
    expect(digest).toHaveLength(64);
    expect(constantTimeEqual(digest, digest)).toBe(true);
  });

  it("rejects short or missing bearer tokens", () => {
    expect(readBearerToken(null)).toBeNull();
    expect(readBearerToken("Bearer short")).toBeNull();
    expect(readBearerToken(`Bearer ${"x".repeat(32)}`)).toHaveLength(32);
  });
});
