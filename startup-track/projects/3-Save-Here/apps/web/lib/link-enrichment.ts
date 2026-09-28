import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_HTML_BYTES = 1_000_000;
const FETCH_TIMEOUT_MS = 1_200;

export type LinkMetadata = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
};

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function metaContent(html: string, name: string) {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=[\\\"']${name}[\\\"'][^>]+content=[\\\"']([^\\\"']*)[\\\"'][^>]*>`,
    "i",
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=[\\\"']([^\\\"']*)[\\\"'][^>]+(?:property|name)=[\\\"']${name}[\\\"'][^>]*>`,
    "i",
  );
  return decodeEntities(pattern.exec(html)?.[1] ?? reversePattern.exec(html)?.[1] ?? "");
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/[\[\]]/g, "");
  if (host === "localhost" || host.endsWith(".local") || host === "::1") return true;
  const octets = host.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  return octets[0] === 10 || octets[0] === 127 || (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 169 && octets[1] === 254);
}

export function isSafePublicUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !isPrivateHostname(url.hostname);
  } catch {
    return false;
  }
}

export function extractLinkMetadata(html: string, sourceUrl: string): LinkMetadata {
  const titleTag = /<title[^>]*>([\\s\\S]*?)<\\/title>/i.exec(html)?.[1] ?? "";
  const title = metaContent(html, "og:title") || metaContent(html, "twitter:title") || decodeEntities(titleTag);
  const description = metaContent(html, "og:description") || metaContent(html, "twitter:description") || metaContent(html, "description");
  const image = metaContent(html, "og:image") || metaContent(html, "twitter:image") || metaContent(html, "twitter:image:src");
  let imageUrl: string | null = null;
  if (image) {
    try {
      const candidate = new URL(image, sourceUrl);
      if ((candidate.protocol === "https:" || candidate.protocol === "http:") && !isPrivateHostname(candidate.hostname)) imageUrl = candidate.toString();
    } catch {
      imageUrl = null;
    }
  }
  return {
    title: title ? title.slice(0, 300) : null,
    description: description ? description.slice(0, 600) : null,
    imageUrl,
  };
}

async function fetchMetadata(url: string) {
  if (!isSafePublicUrl(url)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept: "text/html,application/xhtml+xml", "user-agent": "SaveHereBot/0.1 (+personal-library)" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return null;
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_HTML_BYTES) return null;
    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    return extractLinkMetadata(html, response.url || url);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function enrichCapturedItem(
  client: SupabaseClient,
  ownerId: string,
  itemId: string,
  sourceUrl: string | null,
) {
  if (!sourceUrl) return;
  const metadata = await fetchMetadata(sourceUrl);
  if (!metadata || (!metadata.title && !metadata.description && !metadata.imageUrl)) return;

  const { data: item } = await client
    .from("items")
    .select("title,user_note,ai_metadata,search_document")
    .eq("id", itemId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!item) return;

  const currentMetadata = item.ai_metadata && typeof item.ai_metadata === "object" ? item.ai_metadata : {};
  const nextMetadata = {
    ...currentMetadata,
    ...(metadata.description ? { preview_description: metadata.description } : {}),
    ...(metadata.imageUrl ? { preview_image_url: metadata.imageUrl } : {}),
    metadata_source: "public_page",
    metadata_fetched_at: new Date().toISOString(),
  };
  const nextTitle = item.title ?? metadata.title;
  const nextSearch = [nextTitle, metadata.description, item.user_note, item.search_document].filter(Boolean).join("\n");
  await client
    .from("items")
    .update({
      title: nextTitle,
      ai_metadata: nextMetadata,
      search_document: nextSearch,
      capture_quality: metadata.imageUrl || metadata.description || metadata.title ? "metadata" : "link_only",
      processing_status: "partial",
      enrichment_version: "deterministic-link-v1",
    })
    .eq("id", itemId)
    .eq("owner_id", ownerId);
}
