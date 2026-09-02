import { readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";

const git = spawnSync(
  "git",
  ["-c", `safe.directory=${process.cwd()}`, "ls-files", "-z"],
  {
  encoding: "utf8",
  shell: false,
  },
);

if (git.status !== 0) {
  console.error("Unable to enumerate tracked files.");
  process.exit(1);
}

const files = git.stdout.split("\0").filter(Boolean);
const findings = [];
const forbiddenPath = [
  /(^|\/)\.env(?:\.|$)/i,
  /(^|\/)(credentials?|secrets?)(\/|\.|$)/i,
  /\.(?:pem|key|p12|pfx|kdbx|sqlite|db|zip|7z|mp4|mov|m4a|pdf|png|jpe?g|heic)$/i,
];
const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["provider token", /\b(?:sk-proj-|sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})/],
  ["configured secret", /^(?:SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|X_BEARER_TOKEN|MEDIA_WORKER_SIGNING_SECRET|CAPTURE_TOKEN_PEPPER)[ \t]*=[ \t]*[^\s#].*$/m],
  ["JWT", /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/],
  ["personal home path", /(?:[A-Za-z]:\\Users\\|C:\/Users\/|\/Users\/|\/home\/)[^\s/\\]+/i],
];

for (const file of files) {
  if (file !== ".env.example" && forbiddenPath.some((pattern) => pattern.test(file))) {
    findings.push(`${file}: forbidden public-repository file type or name`);
  }

  const size = statSync(file).size;
  if (size > 5 * 1024 * 1024) {
    findings.push(`${file}: tracked file exceeds 5 MiB`);
  }

  // The scanner contains the forbidden signatures as source text.
  if (file === "scripts/check-public-safety.mjs") continue;

  let contents;
  try {
    contents = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(contents)) findings.push(`${file}: ${label}`);
  }
}

if (findings.length > 0) {
  console.error("Public-safety check failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Public-safety check passed for ${files.length} tracked files.`);
