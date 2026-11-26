import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("deployment health endpoint", () => {
  it("returns safe deployment diagnostics without secret values", async () => {
    process.env.VERCEL_ENV = "test";
    process.env.VERCEL_GIT_COMMIT_SHA = "commit-test";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret";
    process.env.CAPTURE_TOKEN_PEPPER = "pepper-secret";

    const body = await (await GET()).json();
    expect(body).toEqual({
      ok: true,
      environment: "test",
      commit: "commit-test",
      app_url: "http://localhost:3000",
      supabase_configured: true,
      server_configured: true,
    });
    expect(JSON.stringify(body)).not.toContain("service-role-secret");
    expect(JSON.stringify(body)).not.toContain("pepper-secret");
  });
});
