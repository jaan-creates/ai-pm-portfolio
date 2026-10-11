import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(readFileSync(resolve(root, "fixtures/evidence/cases.json"), "utf8"));
const maxBytes = 100 * 1024 * 1024;
const mimeRules = {
  screenshot: /^image\/(png|jpeg|webp|heic)$/i,
  original: /^(image\/(png|jpeg|webp|heic)|application\/pdf|text\/plain)$/i,
  pdf: /^application\/pdf$/i,
  video: /^video\/(mp4|quicktime|webm)$/i,
};

function accepted(item) {
  return Boolean(
    mimeRules[item.role]
      && mimeRules[item.role].test(item.mime_type)
      && Number.isInteger(item.byte_size)
      && item.byte_size > 0
      && item.byte_size <= maxBytes,
  );
}

const rows = cases.map((item) => {
  const actual = accepted(item) ? "accept" : "reject";
  const passed = actual === item.expected;
  const retention = actual === "accept" && item.role === "video" ? "temporary" : "permanent";
  const retentionPassed = !item.retention || retention === item.retention;
  return { id: item.id, expected: item.expected, actual, passed: passed && retentionPassed };
});
const passed = rows.filter((row) => row.passed).length;
const result = { total: rows.length, passed, failed: rows.length - passed, rows };

if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Evidence policy evaluation: ${passed}/${rows.length} passed (${Math.round((passed / rows.length) * 100)}%)`);
  for (const row of rows) console.log(`${row.passed ? "PASS" : "FAIL"} ${row.id}: ${row.actual}`);
}
if (result.failed > 0) process.exitCode = 1;
