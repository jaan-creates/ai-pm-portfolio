import { NextResponse } from "next/server";
import { captureInputSchema, inferContentType, normalizeUrl } from "@save-recall/domain";
import { readBearerToken, tokenDigest } from "@/lib/capture-token";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "invalid_capture_token" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = captureInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_capture", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "service_not_configured" }, { status: 503 });
  }

  const digest = tokenDigest(token, admin.env.CAPTURE_TOKEN_PEPPER);
  const { data: deviceToken, error: tokenError } = await admin.client
    .from("device_tokens")
    .select("id, owner_id, device_id, expires_at")
    .eq("token_hash", digest)
    .is("revoked_at", null)
    .maybeSingle();

  const expired = deviceToken?.expires_at && new Date(deviceToken.expires_at) <= new Date();
  if (tokenError || !deviceToken || expired || deviceToken.device_id !== parsed.data.device.id) {
    return NextResponse.json({ error: "invalid_capture_token" }, { status: 401 });
  }

  const canonicalUrl = parsed.data.shared_url ? normalizeUrl(parsed.data.shared_url) : null;
  const { data, error } = await admin.client.rpc("capture_url_or_text", {
    p_owner_id: deviceToken.owner_id,
    p_capture_id: parsed.data.capture_id,
    p_device_id: parsed.data.device.id,
    p_shortcut_version: parsed.data.device.shortcut_version ?? null,
    p_input_type: parsed.data.input_type,
    p_shared_url: parsed.data.shared_url ?? null,
    p_canonical_url: canonicalUrl,
    p_shared_text: parsed.data.shared_text ?? null,
    p_user_note: parsed.data.user_note ?? null,
    p_content_type: inferContentType(canonicalUrl),
  });

  if (error) {
    console.error("capture_rpc_failed", { code: error.code });
    return NextResponse.json({ error: "capture_failed" }, { status: 500 });
  }

  await admin.client
    .from("device_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", deviceToken.id);

  return NextResponse.json(data, { status: data.result === "created" ? 201 : 200 });
}
