import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const ALLOWED_STATUSES = new Set(["pending", "completed", "reference"]);

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server configuration unavailable" }, { status: 503 });
  const { data: authData, error: authError } = await admin.client.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as { status?: string } | null;
  const status = body?.status;
  if (status !== "deleted" && !ALLOWED_STATUSES.has(status ?? "")) return NextResponse.json({ error: "Unsupported status" }, { status: 400 });
  const nextStatus = status === "deleted" ? "deleted" : status;
  const update = status === "deleted"
    ? { status: nextStatus, deleted_at: new Date().toISOString() }
    : { status: nextStatus, deleted_at: null, completed_at: status === "completed" ? new Date().toISOString() : null };
  const { data: item, error } = await admin.client.from("items").update(update).eq("id", id).eq("owner_id", authData.user.id).is("deleted_at", null).select("id,status").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update the saved item" }, { status: 500 });
  if (!item) return NextResponse.json({ error: "Saved item not found" }, { status: 404 });
  const eventType = status === "completed" ? "completed" : status === "reference" ? "referenced" : status === "deleted" ? "soft_deleted" : "restored";
  await admin.client.from("item_events").insert({ owner_id: authData.user.id, item_id: id, event_type: eventType });
  return NextResponse.json({ item });
}
