import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL(".", import.meta.url).pathname, "..");
const authGate = readFileSync(resolve(root, "apps/web/components/auth-gate.tsx"), "utf8");
const library = readFileSync(resolve(root, "apps/web/components/personal-library.tsx"), "utf8");
const browser = readFileSync(resolve(root, "apps/web/lib/supabase-browser.ts"), "utf8");
const runtimeConfig = readFileSync(resolve(root, "apps/web/app/api/auth/config/route.ts"), "utf8");
const includes = (source, value) => source.includes(value);

const checks = [
  ["Google OAuth uses Supabase provider", includes(authGate, 'signInWithOAuth') && includes(authGate, 'provider: "google"')],
  ["OAuth returns to the current origin", includes(authGate, "redirectTo: window.location.origin")],
  ["Magic-link fallback remains available", includes(authGate, "signInWithOtp")],
  ["OAuth failure explains fallback", includes(authGate, "Use email sign-in instead")],
  ["Session listener updates the account view", includes(authGate, "onAuthStateChange")],
  ["Sign out remains available", includes(library, "signOut")],
  ["Library resolves the authenticated user", includes(library, "auth.getUser()")],
  ["Runtime config exposes only publishable values", includes(runtimeConfig, "NEXT_PUBLIC_SUPABASE_URL") && includes(runtimeConfig, "NEXT_PUBLIC_SUPABASE_ANON_KEY") && !/SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(runtimeConfig)],
  ["Browser client never contains service-role credentials", !/SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(authGate + "\\n" + browser)],
];

const passed = checks.filter(([, ok]) => ok).length;
console.log("Auth flow evaluation: " + passed + "/" + checks.length + " passed (" + Math.round((passed / checks.length) * 100) + "%)");
for (const [label, ok] of checks) console.log((ok ? "PASS " : "FAIL ") + label);
if (passed !== checks.length) process.exitCode = 1;
