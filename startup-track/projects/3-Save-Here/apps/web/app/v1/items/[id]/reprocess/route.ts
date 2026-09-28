import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { enrichCapturedItem } from "@/lib/link-enrichment";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server configuration unavailable" }, { status: 503 });

  const { data: authData, error: authError } = await admin.client.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  const { data: item, error: itemError } = await admin.client
    .from("items")
    .select("id, original_url, canonical_url")
    .eq("id", id)
    .eq("owner_id", authData.user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (itemError) return NextResponse.json({ error: "Could not load the saved item" }, { status: 500 });
  if (!item) return NextResponse.json({ error: "Saved item not found" }, { status: 404 });

  const changed = await enrichCapturedItem(admin.client, authData.user.id, item.id, item.original_url ?? item.canonical_url);
  return NextResponse.json({ item_id: item.id, result: changed ? "enriched" : "unchanged" });
}
