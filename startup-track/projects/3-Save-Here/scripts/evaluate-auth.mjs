import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL(".", import.meta.url).pathname, "..");
const authGate = readFileSync(resolve(root, "apps/web/components/auth-gate.tsx"), "utf8");
const library = readFileSync(resolve(root, "apps/web/components/personal-library.tsx"), "utf8");
const browser = readFileSync(resolve(root, "apps/web/lib/supabase-browser.ts"), "utf8");

const checks = [
  ["Google OAuth uses Supabase provider", /signInWithOAuth\\(\\{[\\s\\S]*provider:\\s*"google"/.test(authGate)],
  ["OAuth returns to the current origin", /redirectTo:\\s*window\\.location\\.origin/.test(authGate)],
  ["Magic-link fallback remains available", /signInWithOtp/.test(authGate)],
  ["OAuth failure explains fallback", /Use email sign-in instead/.test(authGate)],
  ["Session listener updates the account view", /onAuthStateChange/.test(authGate)],
  ["Sign out remains available", /signOut/.test(library)],
  ["Library resolves the authenticated user", /auth\\.getUser\\(\\)/.test(library)],
  ["Browser client never contains service-role credentials", !/SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(authGate + "\\n" + browser)],
];

const passed = checks.filter(([, ok]) => ok).length;
console.log("Auth flow evaluation: " + passed + "/" + checks.length + " passed (" + Math.round((passed / checks.length) * 100) + "%)");
for (const [label, ok] of checks) console.log((ok ? "PASS " : "FAIL ") + label);
if (passed !== checks.length) process.exitCode = 1;
