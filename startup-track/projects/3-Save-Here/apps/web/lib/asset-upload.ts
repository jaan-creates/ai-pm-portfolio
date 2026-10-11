export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export const ASSET_ROLES = ["screenshot", "original", "pdf", "video"] as const;
export type AssetRole = (typeof ASSET_ROLES)[number];

const MIME_BY_ROLE: Record<AssetRole, RegExp> = {
  screenshot: /^image\/(png|jpeg|webp|heic)$/i,
  original: /^(image\/(png|jpeg|webp|heic)|application\/pdf|text\/plain)$/i,
  pdf: /^application\/pdf$/i,
  video: /^video\/(mp4|quicktime|webm)$/i,
};

export function validateUploadRequest(input: unknown) {
  const body = (input ?? {}) as Record<string, unknown>;
  const itemId = typeof body.item_id === "string" ? body.item_id : "";
  const role = typeof body.role === "string" ? body.role as AssetRole : undefined;
  const mimeType = typeof body.mime_type === "string" ? body.mime_type : "";
  const byteSize = typeof body.byte_size === "number" ? body.byte_size : NaN;

  if (!itemId || !role || !ASSET_ROLES.includes(role)) return { ok: false as const, error: "invalid_item_or_role" };
  if (!MIME_BY_ROLE[role].test(mimeType)) return { ok: false as const, error: "unsupported_file_type" };
  if (!Number.isInteger(byteSize) || byteSize <= 0 || byteSize > MAX_UPLOAD_BYTES) return { ok: false as const, error: "file_too_large_or_empty" };

  return { ok: true as const, itemId, role, mimeType, byteSize };
}

export function expectedAssetPath(ownerId: string, itemId: string, assetId: string) {
  return `${ownerId}/${itemId}/${assetId}`;
}
