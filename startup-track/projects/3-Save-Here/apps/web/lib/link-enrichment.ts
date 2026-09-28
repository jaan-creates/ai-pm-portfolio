import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_HTML_BYTES = 1_000_000;
const FETCH_TIMEOUT_MS = 1_200;
const SAFE_METADATA_HOSTS = new Set(["amazon.com", "amazon.in", "flipkart.com", "github.com", "instagram.com", "medium.com", "twitter.com", "wikipedia.org", "x.com", "youtu.be", "youtube.com"]);

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
  const host = hostname.toLowerCase().replace(/[\\[\\]]/g, "");
  return host === "localhost" || host.endsWith(".local") || host === "::1";
}

function isPrivateIp(address: string) {
  const value = address.toLowerCase();
  if (value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb")) return true;
  const mapped = value.match(/^::ffff:(\\d+\\.\\d+\\.\\d+\\.\\d+)$/)?.[1] ?? value;
  const octets = mapped.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  return octets[0] === 10 || octets[0] === 127 || (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 0);
}

export function isSafePublicUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const allowedHost = [...SAFE_METADATA_HOSTS].some((host) => hostname === host || hostname.endsWith(`.${host}`));
    return allowedHost && (url.protocol === "https:" || url.protocol === "http:") && !isPrivateHostname(hostname) && !isPrivateIp(hostname);
  } catch {
    return false;
  }
}

async function resolvePublicAddress(hostname: string) {
  const { lookup } = await import("node:dns/promises");
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) return null;
  return addresses[0];
}

export function extractLinkMetadata(html: string, sourceUrl: string): LinkMetadata {
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
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

async function requestPublicHtml(url: string, redirectsLeft = 3): Promise<{ html: string; finalUrl: string } | null> {
  if (!isSafePublicUrl(url)) return null;
  const parsed = new URL(url);
  const address = await resolvePublicAddress(parsed.hostname).catch(() => null);
  if (!address) return null;
  const transport = parsed.protocol === "https:" ? await import("node:https") : await import("node:http");
  return new Promise((resolve) => {
    const request = transport.get({
      hostname: address.address,
      port: parsed.port || undefined,
      path: `${parsed.pathname}${parsed.search}`,
      headers: { accept: "text/html,application/xhtml+xml", "user-agent": "SaveHereBot/0.1 (+personal-library)", host: parsed.host },
      servername: parsed.hostname,
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      timeout: FETCH_TIMEOUT_MS,
    }, (response) => {
      const status = response.statusCode ?? 0;
      const location = response.headers.location;
      if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
        response.resume();
        const nextUrl = new URL(location, parsed).toString();
        void requestPublicHtml(nextUrl, redirectsLeft - 1).then(resolve);
        return;
      }
      if (status < 200 || status >= 300 || !String(response.headers["content-type"] ?? "").includes("text/html")) {
        response.resume();
        resolve(null);
        return;
      }
      const length = Number(response.headers["content-length"] ?? 0);
      if (length > MAX_HTML_BYTES) {
        response.resume();
        resolve(null);
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_HTML_BYTES) {
          request.destroy();
          resolve(null);
        } else {
          chunks.push(chunk);
        }
      });
      response.on("end", () => resolve({ html: Buffer.concat(chunks).toString("utf8"), finalUrl: parsed.toString() }));
      response.on("error", () => resolve(null));
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(null));
  });
}

async function fetchMetadata(url: string) {
  const result = await requestPublicHtml(url);
  return result ? extractLinkMetadata(result.html, result.finalUrl) : null;
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
