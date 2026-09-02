import { createHmac, timingSafeEqual } from "node:crypto";

export function tokenDigest(token: string, pepper: string) {
  return createHmac("sha256", pepper).update(token, "utf8").digest("hex");
}

export function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function readBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length >= 32 ? token : null;
}

type CaptureTokenAccessInput = {
  lookupFailed: boolean;
  tokenFound: boolean;
  expiresAt: string | null;
  storedDeviceId: string | null;
  requestedDeviceId: string;
  now?: Date;
};

export function assessCaptureTokenAccess({
  lookupFailed,
  tokenFound,
  expiresAt,
  storedDeviceId,
  requestedDeviceId,
  now = new Date(),
}: CaptureTokenAccessInput): "valid" | "invalid" | "unavailable" {
  if (lookupFailed) return "unavailable";

  const expired = expiresAt !== null && new Date(expiresAt) <= now;
  if (!tokenFound || expired || storedDeviceId !== requestedDeviceId) return "invalid";

  return "valid";
}
