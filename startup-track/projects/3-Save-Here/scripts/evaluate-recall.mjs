import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const items = JSON.parse(readFileSync(resolve(root, "fixtures/recall/items.json"), "utf8"));
const queries = JSON.parse(readFileSync(resolve(root, "fixtures/recall/queries.json"), "utf8"));

const STOP_WORDS = new Set([
  "a", "about", "and", "for", "i", "in", "of", "on", "the", "that", "the", "to", "with",
]);

function tokens(value) {
  return new Set(
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

function score(query, item) {
  const wanted = tokens(query);
  const title = tokens(item.title);
  const document = tokens(item.search_document);
  const intent = tokens(item.intent);
  const source = tokens(item.source);
  let value = 0;

  for (const token of wanted) {
    if (title.has(token)) value += 5;
    else if (document.has(token)) value += 3;
    if (intent.has(token)) value += 2;
    if (source.has(token)) value += 2;
  }

  return value + Math.min(document.size, 20) / 100;
}

function evaluate() {
  const rows = queries.map((query) => {
    const ranked = [...items]
      .map((item) => ({ id: item.id, score: score(query.query, item) }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    const rank = ranked.findIndex((item) => item.id === query.expected_item_id) + 1;
    return {
      query: query.query,
      expected_item_id: query.expected_item_id,
      rank,
      passed: rank > 0 && rank <= query.acceptable_rank,
      top_results: ranked.slice(0, query.acceptable_rank).map((item) => item.id),
    };
  });

  const passed = rows.filter((row) => row.passed).length;
  return {
    total: rows.length,
    passed,
    failed: rows.length - passed,
    top_five_recall: rows.length === 0 ? 0 : passed / rows.length,
    rows,
  };
}

const result = evaluate();
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Offline recall evaluation: ${result.passed}/${result.total} passed (${Math.round(result.top_five_recall * 100)}%)`);
  for (const row of result.rows) {
    console.log(`${row.passed ? "PASS" : "FAIL"} rank=${row.rank || "-"} ${row.query}`);
    if (!row.passed) console.log(`  top results: ${row.top_results.join(", ") || "none"}`);
  }
}

if (result.failed > 0) process.exitCode = 1;
