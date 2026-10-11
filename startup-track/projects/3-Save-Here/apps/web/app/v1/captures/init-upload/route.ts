import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { expectedAssetPath, validateUploadRequest } from "@/lib/asset-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server configuration unavailable" }, { status: 503 });
  const { data: authData, error: authError } = await admin.client.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = validateUploadRequest(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data: item, error: itemError } = await admin.client
    .from("items")
    .select("id")
    .eq("id", parsed.itemId)
    .eq("owner_id", authData.user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (itemError) return NextResponse.json({ error: "Could not validate saved item" }, { status: 500 });
  if (!item) return NextResponse.json({ error: "Saved item not found" }, { status: 404 });

  const assetId = crypto.randomUUID();
  const path = expectedAssetPath(authData.user.id, parsed.itemId, assetId);
  const { data, error } = await admin.client.storage.from("private-assets").createSignedUploadUrl(path);
  if (error || !data?.token) return NextResponse.json({ error: "Could not prepare evidence upload" }, { status: 503 });

  return NextResponse.json({
    asset_id: assetId,
    bucket: "private-assets",
    path,
    token: data.token,
    expires_in_seconds: 7200,
    role: parsed.role,
    mime_type: parsed.mimeType,
    byte_size: parsed.byteSize,
  });
}
