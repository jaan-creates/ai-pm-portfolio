import { z } from "zod";

export const itemStatuses = ["pending", "completed", "reference", "deleted"] as const;
export const inputTypes = ["url", "text", "image", "pdf", "video", "file"] as const;
export const contentTypes = [
  "article",
  "instagram_post",
  "instagram_reel",
  "x_post",
  "video",
  "product",
  "recipe",
  "image",
  "pdf",
  "note",
  "event",
  "other",
] as const;
export const intents = [
  "read",
  "watch",
  "buy",
  "make",
  "cook",
  "learn",
  "reference",
  "visit",
  "try",
  "unknown",
] as const;
export const captureQualities = [
  "full_text",
  "metadata",
  "visual",
  "audio_visual",
  "link_only",
  "failed",
] as const;
export const processingStatuses = [
  "received",
  "stored",
  "queued",
  "extracting",
  "enriching",
  "indexing",
  "ready",
  "partial",
  "failed",
] as const;

export const captureInputSchema = z
  .object({
    capture_id: z.string().uuid(),
    input_type: z.enum(["url", "text"]),
    shared_url: z.string().url().max(4096).nullish(),
    shared_text: z.string().trim().min(1).max(50_000).nullish(),
    user_note: z.string().trim().max(500).nullish(),
    device: z.object({
      id: z.string().uuid(),
      shortcut_version: z.string().trim().max(32).nullish(),
    }),
  })
  .superRefine((value, context) => {
    if (value.input_type === "url" && !value.shared_url) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shared_url"],
        message: "A URL capture requires shared_url.",
      });
    }
    if (value.input_type === "text" && !value.shared_text) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shared_text"],
        message: "A text capture requires shared_text.",
      });
    }
  });

export type CaptureInput = z.infer<typeof captureInputSchema>;

export type CaptureResponse = {
  capture_id: string;
  item_id: string;
  result: "created" | "merged";
  processing_status: "queued";
};

const trackingParameters = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
  "s",
]);

export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || trackingParameters.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  if (url.hostname === "twitter.com" || url.hostname === "mobile.twitter.com") {
    url.hostname = "x.com";
  }

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  url.searchParams.sort();
  return url.toString();
}

export function inferContentType(urlValue?: string | null) {
  if (!urlValue) return "note" as const;
  const url = new URL(urlValue);
  if (url.hostname.endsWith("instagram.com")) {
    return url.pathname.includes("/reel/") ? ("instagram_reel" as const) : ("instagram_post" as const);
  }
  if (url.hostname === "x.com" || url.hostname.endsWith(".x.com")) return "x_post" as const;
  return "article" as const;
}
