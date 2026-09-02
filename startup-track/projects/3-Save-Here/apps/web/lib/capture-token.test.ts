import { describe, expect, it } from "vitest";
import {
  assessCaptureTokenAccess,
  constantTimeEqual,
  readBearerToken,
  tokenDigest,
} from "./capture-token";

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

  it("distinguishes provider outages from invalid credentials", () => {
    const requestedDeviceId = "9ce68a18-96b1-44f8-ac02-b2103d9649e8";

    expect(
      assessCaptureTokenAccess({
        lookupFailed: true,
        tokenFound: false,
        expiresAt: null,
        storedDeviceId: null,
        requestedDeviceId,
      }),
    ).toBe("unavailable");

    expect(
      assessCaptureTokenAccess({
        lookupFailed: false,
        tokenFound: false,
        expiresAt: null,
        storedDeviceId: null,
        requestedDeviceId,
      }),
    ).toBe("invalid");
  });

  it("accepts only a live token bound to the requesting device", () => {
    const deviceId = "9ce68a18-96b1-44f8-ac02-b2103d9649e8";
    const now = new Date("2026-09-02T00:00:00Z");

    expect(
      assessCaptureTokenAccess({
        lookupFailed: false,
        tokenFound: true,
        expiresAt: "2026-09-03T00:00:00Z",
        storedDeviceId: deviceId,
        requestedDeviceId: deviceId,
        now,
      }),
    ).toBe("valid");

    expect(
      assessCaptureTokenAccess({
        lookupFailed: false,
        tokenFound: true,
        expiresAt: "2026-09-01T00:00:00Z",
        storedDeviceId: deviceId,
        requestedDeviceId: deviceId,
        now,
      }),
    ).toBe("invalid");
  });
});
