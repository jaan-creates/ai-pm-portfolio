import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { expectedAssetPath, validateUploadRequest } from "@/lib/asset-upload";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server configuration unavailable" }, { status: 503 });
  const { data: authData, error: authError } = await admin.client.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const parsed = validateUploadRequest({ ...(body ?? {}), item_id: id });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const assetId = typeof body?.asset_id === "string" ? body.asset_id : "";
  const storagePath = typeof body?.storage_path === "string" ? body.storage_path : "";
  const sha256 = typeof body?.sha256 === "string" ? body.sha256 : "";
  if (!assetId || !storagePath || !/^[a-f0-9]{64}$/i.test(sha256)) return NextResponse.json({ error: "invalid_asset_metadata" }, { status: 400 });

  const expectedPath = expectedAssetPath(authData.user.id, id, assetId);
  if (storagePath !== expectedPath) return NextResponse.json({ error: "invalid_asset_path" }, { status: 400 });

  const { data: item, error: itemError } = await admin.client
    .from("items")
    .select("id")
    .eq("id", id)
    .eq("owner_id", authData.user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (itemError) return NextResponse.json({ error: "Could not validate saved item" }, { status: 500 });
  if (!item) return NextResponse.json({ error: "Saved item not found" }, { status: 404 });

  const { data: asset, error } = await admin.client
    .from("assets")
    .insert({
      id: assetId,
      owner_id: authData.user.id,
      item_id: id,
      role: parsed.role,
      storage_bucket: "private-assets",
      storage_path: storagePath,
      mime_type: parsed.mimeType,
      byte_size: parsed.byteSize,
      sha256,
      width: typeof body?.width === "number" ? body.width : null,
      height: typeof body?.height === "number" ? body.height : null,
      duration_ms: typeof body?.duration_ms === "number" ? body.duration_ms : null,
      retention_class: parsed.role === "video" ? "temporary" : "permanent",
      purge_after: parsed.role === "video" ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
    })
    .select("id,item_id,role,mime_type,byte_size,storage_path,retention_class,purge_after")
    .single();

  if (error) return NextResponse.json({ error: "Could not record evidence" }, { status: 500 });

  // Enrichment is best-effort: the durable asset must remain captured even if the queue is unavailable.
  const { error: jobError } = await admin.client.from("jobs").insert({
    owner_id: authData.user.id,
    item_id: id,
    job_type: "evidence_understanding",
    status: "queued",
    payload: { asset_id: asset.id, role: asset.role, mime_type: asset.mime_type },
  });
  await admin.client.from("item_events").insert({ owner_id: authData.user.id, item_id: id, event_type: "captured", metadata: { asset_id: asset.id, role: asset.role, enrichment_queued: !jobError } });
  return NextResponse.json({ asset, enrichment_queued: !jobError }, { status: 201 });
}
