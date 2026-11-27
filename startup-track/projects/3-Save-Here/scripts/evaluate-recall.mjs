import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const items = JSON.parse(readFileSync(resolve(root, "fixtures/recall/items.json"), "utf8"));
const queries = JSON.parse(readFileSync(resolve(root, "fixtures/recall/queries.json"), "utf8"));
const STOP_WORDS = new Set(["a","about","and","for","i","in","of","on","the","that","to","with"]);
const tokens = (value) => new Set(String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((t) => t.length > 2 && !STOP_WORDS.has(t)));
function score(query, item) {
  const wanted = tokens(query), title = tokens(item.title), document = tokens(item.search_document), intent = tokens(item.intent), source = tokens(item.source);
  let value = 0;
  for (const token of wanted) {
    if (title.has(token)) value += 5; else if (document.has(token)) value += 3;
    if (intent.has(token)) value += 2;
    if (source.has(token)) value += 2;
  }
  return value + Math.min(document.size, 20) / 100;
}
const rows = queries.map((query) => {
  const ranked = items.map((item) => ({ id: item.id, score: score(query.query, item) })).sort((a,b) => b.score - a.score || a.id.localeCompare(b.id));
  const rank = ranked.findIndex((item) => item.id === query.expected_item_id) + 1;
  return { query: query.query, expected_item_id: query.expected_item_id, rank, passed: rank > 0 && rank <= query.acceptable_rank, top_results: ranked.slice(0, query.acceptable_rank).map((item) => item.id) };
});
const passed = rows.filter((row) => row.passed).length;
const result = { total: rows.length, passed, failed: rows.length - passed, top_five_recall: rows.length ? passed / rows.length : 0, rows };
if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Offline recall evaluation: ${result.passed}/${result.total} passed (${Math.round(result.top_five_recall * 100)}%)`);
  for (const row of result.rows) console.log(`${row.passed ? "PASS" : "FAIL"} rank=${row.rank || "-"} ${row.query}`);
}
if (result.failed > 0) process.exitCode = 1;
