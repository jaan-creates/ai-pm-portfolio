import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    environment: process.env.VERCEL_ENV ?? "unknown",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown",
    app_url: process.env.NEXT_PUBLIC_APP_URL ?? null,
    supabase_configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    server_configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.CAPTURE_TOKEN_PEPPER),
  });
}
