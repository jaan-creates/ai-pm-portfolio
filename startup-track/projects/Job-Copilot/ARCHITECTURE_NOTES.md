# ARCHITECTURE_NOTES — career-ops + hiring-agent autopsy

Mined 2026-07-21 from `career-ops@8c941ee` (santifer, MIT) and `hiring-agent@4db8655` (interviewstreet, MIT). File paths relative to `_mined/<repo>/`. Target product: hosted app for Lead/Senior PMs in active job search.

---

## 1. career-ops — significant decisions

### 1.1 Prompts-as-code: markdown "modes" are the application logic

**What they built:** All LLM behavior lives in versioned markdown files (`modes/*.md`); `modes/_shared.md` is the scoring core, `modes/oferta.md` the evaluation workflow. Any agent CLI (Claude Code, Codex, Gemini…) executes them; deterministic work is pushed into ~50 zero-token Node scripts at the repo root (ARCHITECTURE.md "Component map"; AGENTS.md).

**What it assumes:** An engineer comfortable running an AI coding CLI against a git checkout, reading markdown specs, and paying per-token — the user *is* the runtime.

**PM-native alternative:** Keep the separation (prompt layer vs deterministic layer — it's the right cut), but prompts become server-side versioned templates invisible to the user, and every "mode" becomes a product flow with UI state. The discipline worth stealing: **anything that can be deterministic is deterministic** (liveness checks, dedup, skill-gap classification, stats are all zero-LLM in career-ops), which is both a cost model and a reliability model.

### 1.2 Files are canonical; databases are derived

**What they built:** `data/applications.md` (a markdown table) and `reports/*.md` are the permanent source of truth; SQLite exists only as a rebuildable index — settled doctrine, their issue #918 (ARCHITECTURE.md "Files are canonical"). All writers go through locked, atomic, canonical write paths (`set-status.mjs`, `merge-tracker.mjs`, `tracker-utils.mjs`).

**What it assumes:** Git-diffable local files, an ecosystem of forks/plugins reading them, one user per checkout.

**PM-native alternative:** Invert it — the database is canonical, exports are derived. But three sub-decisions transfer intact: (1) one canonical write path per entity, because LLM agents will otherwise hand-edit storage (set-status.mjs:3-8); (2) an append-only event ledger beside current state (status-log.tsv feeding funnel-velocity.mjs) — corrections append, never rewrite; (3) machine summaries co-located with human documents (the `## Machine Summary` YAML in every report) so downstream features never re-parse prose.

### 1.3 The two-layer data contract (system vs user)

**What they built:** Strict system-layer / user-layer split (DATA_CONTRACT.md; AGENTS.md "Data Contract"): the updater may touch `modes/`, scripts, templates; it must never touch `cv.md`, profiles, tracker, reports. Enforced by tests (`updater-migration-tests.mjs`) and CI checks, and `cv-sync-check.mjs` lints user metrics out of system prompt files.

**What it assumes:** Self-updating software on the user's disk.

**PM-native alternative:** In a hosted app the split becomes prompt-template versioning vs user data — trivially true at the DB level, but the deeper rule still bites: **user facts must never be baked into shared prompt text**, and personalization must live in a user-owned layer (`modes/_profile.md` overriding `_shared.md` defaults → per-user rubric overrides on top of a shared rubric, batch-prompt.md:52-62).

### 1.4 Source-of-truth boundary for generated content (anti-fabrication constitution)

**What they built:** User-facing content may draw ONLY from an enumerated file list; "keywords get reformulated, never fabricated"; authorship claims require explicit attribution ("tool-of-trade conflation… is the most common fabrication pattern and is explicitly forbidden"); silence beats manufactured detail (AGENTS.md "Source-of-Truth Boundary"; modes/_shared.md:26-31). Backstopped deterministically by `verify-cv-facts.mjs` (metric claims ⊆ sources) — prompt rule + code gate for the same failure.

**What it assumes:** Nothing engineer-specific. This is the most persona-independent asset in the repo.

**PM-native alternative:** Adopt wholesale. For PMs the fabrication pattern shifts from "user built X" to inflated ownership ("led" vs "contributed to", ARR owned vs influenced) — same constitution, different confusion pairs; extend the fact gate beyond numeric metrics to scope claims (team size, budget, ARR).

### 1.5 Human-in-the-loop as an ethical boundary, not a UX preference

**What they built:** Never submit applications; fill and stop before Submit. Below 4.0/5, actively discourage applying — "quality over quantity", the recruiter's attention is a respected resource (AGENTS.md "Ethical Use"). Legitimacy findings are presented as signals with innocent explanations, never accusations (modes/_shared.md:109-113). Plugin-supplied instructions are explicitly UNTRUSTED and cannot override core behavior (AGENTS.md:135) — prompt-injection defense as policy.

**PM-native alternative:** Keep every one of these as product policy. A hosted tool that auto-blasts applications is both ethically wrong by this standard and reputationally fatal with the senior-PM audience.

### 1.6 Discovery via public ATS APIs, trust-flagged, never auto-filtered

**What they built:** `scan.mjs` + 67 per-portal providers hit public no-auth ATS APIs (zero-token); `_trust-validator.mjs` penalty-scores results (shorteners, company↔domain mismatch) but "never drops jobs — flag only"; `_http.mjs` centralizes timeouts and the WAF-clearing browser UA.

**What it assumes:** CLI user tolerant of per-board YAML config and occasional scraping breakage.

**PM-native alternative:** Server-side scheduled scanning with the same adapter pattern and the same flag-don't-drop principle (false-negative jobs are unrecoverable; flagged jobs are user-triageable). The three-state liveness classifier (`liveness-core.mjs`) transfers unchanged.

### 1.7 Cost control as architecture

**What they built:** Spend tiers route evaluation to cheaper/dearer models with guaranteed output parity (modes/_shared.md:35-57); hard research budget (5 searches/evaluation, no recursive research agents — modes/_shared.md:205-211, oferta.md:27-38); golden-set eval decides when a cheap model is safe to route to (evals/README.md); zero-token paths for everything deterministic; report numbers reserved before parallel fan-out (AGENTS.md "Headless / Batch Mode").

**PM-native alternative:** This maps 1:1 to hosted-margin engineering: per-evaluation token budgets, model routing gated by golden-set agreement (not vibes), bounded tool loops, and cost/usage meters surfaced in UI (career-ops's web UI has cost badges and usage meters — web/src/components/cost/cost-badge.tsx, usage-meter.tsx).

### 1.8 The web/ UI is their own admission that CLI isn't the product

**What they built:** A Next.js app wrapping the same file store: today-dashboard with decision cards and follow-up cards, inbox triage, pipeline board, quick-evaluate, score-methodology explainer, CV editor with quality checks (web/src/app/*, web/src/components/*).

**What it assumes:** Even for engineers, the daily loop wants a GUI; the CLI remains the engine.

**PM-native alternative:** Their web IA is a validated starting wireframe for a PM-facing product: Today (what needs a decision now) / Inbox (new finds to triage) / Pipeline (state board) / Job detail (report + risk summary) / CV studio / Analytics. Notably they ship a "score methodology" component — score explainability is a first-class screen, which matches a senior-PM audience's demand to audit the rubric.

### 1.9 hiring-agent — pipeline shape: convert → parse-per-section → normalize → validate → score → clamp

**What they built:** PDF → layout-aware markdown (pymupdf_rag.py) → six section-scoped LLM extractions with per-section schemas (pdf.py:266-299) → deterministic normalization absorbing LLM output variance (transform.py) → pydantic validation (models.py) → rubric-prompt scoring → code-side clamps (score.py). GitHub/blog enrichment is out-of-scope for us.

**What it assumes:** Batch evaluation of many candidate resumes by a hiring team; local models; a single hardcoded persona ("Software Intern at HackerRank", resume_evaluation_criteria.jinja:1).

**PM-native alternative:** Same pipeline shape, flipped subject: the user's resume is parsed once at onboarding (per-section, JSON-Resume-shaped), each JD parsed per-section on ingestion, and the scorer runs section-to-JD with per-dimension evidence. The layered defense (schema at call time → alias/type normalization → validation → clamps) is the reference implementation for every LLM call in the product.

---

## 2. Prompt & rubric patterns (first-class mining target)

### hiring-agent

- **Section-scoped extraction prompts** — one Jinja template per resume section, each restating: extract ONLY this section, inline example JSON of the exact shape, "ONLY valid JSON" twice, task-specific micro-rules (8 date-format rules in work.jinja:22-33). Schema also enforced at API level (`format=model_json_schema()`). *Pattern: prompt shows an example instance; schema enforces; code normalizes; never rely on one layer.*
- **Anchored rubric bands with named examples** (resume_evaluation_criteria.jinja:34-114): each category has point bands with concrete positive AND negative anchors ("Hacktoberfest alone = 3-5 points max"; enumerated tutorial-project list). Deductions are itemized with point ranges. *This is what makes cheap models score consistently.*
- **Fairness blindlist** stated in both system message and rubric (no name/gender/school/GPA/location influence) — resume_evaluation_system_message.jinja:5-11.
- **Confusion-pair disambiguation** as a dedicated prompt section (GSoC vs Girl Script) — criteria.jinja:21-25.
- **Cross-field consistency rules** (evidence saying "no OSS" forbids OSS in key_strengths) — system_message.jinja:23.
- **Constraints in triplicate**: prose bands + numeric caps block + schema bounds + display clamps (criteria.jinja:155-164; models.py:218-249; score.py:42-69).
- **Anti-task-drift guards** written from observed failures: "You are NOT writing a resume summary", "no <think> tags" — paired with code-side strippers (llm_utils.py:24-37).
- **Latent defect worth learning from:** the system message demands a `candidate_name` field the pydantic schema doesn't define (system_message.jinja:31 vs models.py:244-249) — hand-written shape prose drifts from the real schema. Generate prompt shape-text from the validation model.

### career-ops

- **Rubric anchored to actions, not adjectives**: score bands map to recommendations (4.5+ apply now; <3.5 don't) — _shared.md:72-76. Culture screen has structural override semantics: contradicted evidence caps the dimension at 2/5 and forces a surfaced warning; absence of evidence is neutral, never negative (_shared.md:79-85).
- **Separation of orthogonal judgments**: fit score (1-5) vs legitimacy tier (3 states) vs risk signals — each with its own evidence rules, never blended (_shared.md:87-113); "no data" defaults are explicitly conservative-but-not-paranoid (no date → "Proceed with Caution", never "Suspicious", oferta.md:329).
- **Evidence requirements**: CV matches cite exact CV lines (_shared.md:183); geo-mismatch and classification flags quote the JD verbatim, never paraphrase (oferta.md:68-70); advertised comp is verbatim-or-null, machine-readable, and never blended with researched estimates (oferta.md:169-175, 489).
- **Risk Summary contract**: aggregation-only, zero new judgment, fixed row order, `— not evaluated` as first-class state so an all-clear can be trusted (oferta.md:334-362; batch-prompt.md Risk Summary).
- **Dual-output discipline**: every report carries a `## Machine Summary` YAML fence with exact keys, strict enums, `[]`-for-empty, "do not invent missing data — set confidence Low"; predicted `discard_reasons` feed later analytics (batch-prompt.md:299-345). The schema lives in ONE file that other modes cite rather than duplicate.
- **User-layer rubric overrides**: personalization (block caps, forced SKIPs, dimension rules) loaded after system defaults and winning conflicts (batch-prompt.md:52-62).
- **Self-contained batch worker prompt** with orchestrator placeholders and a structured-failure contract (batch-prompt.md:14, Step 1).
- **Retry-on-invalid**: standalone evaluators validate report structure with regex block-checks + bounded numeric score before persisting anything; invalid output → nothing saved, actionable guidance (gemini-eval.mjs:160-199, 320-326). hiring-agent's Gemini provider adds the transport-level pattern: bounded exponential backoff honoring the API's own retry hint, jitter, re-raise on exhaustion (models.py:335-391).
- **Golden-set evals as routing gate**: 10 synthetic labeled JDs biased toward hybrid/ambiguous archetypes; agreement-with-reference metric; archetype agreement gates at 0.8, score within ±0.5 secondary; $0 deterministic replay fixtures; `provenance` on every label (evals/README.md).
- **Recruiter's-eye heuristics as a prompt module** (modes/heuristics/recruiter-side.md, referenced from _shared.md:316): the "how the other side reads you" lens packaged separately and pulled into writing flows.

---

## 3. What both repos assume that our product must not

| Assumption | Where it shows | Our reality |
|---|---|---|
| User is the runtime (CLI, git, node) | career-ops entire UX; hiring-agent `python score.py` | Hosted app; all machinery server-side |
| GitHub/code artifacts are the evidence base | hiring-agent github.py + 35 pts of rubric; career-ops `project` mode | PM evidence = outcomes, metrics, leadership artifacts, STAR+R stories |
| Single persona hardcoded in the rubric | criteria.jinja:1 ("Software Intern at HackerRank") | Rubric must be role-archetype-parameterized (career-ops's archetype system is the better model) |
| Engineer-market archetypes | _shared.md:147-160 (LLMOps, FDE…) | Replace taxonomy with PM archetypes (platform, growth, 0→1, PLG, enterprise, AI PM) — mechanism transfers, vocabulary doesn't |
| Local single-user files → locks | tracker lock machinery | DB transactions; but keep retryable-vs-fatal error contract and append-only ledgers |

---

## Attribution

Ready to paste into the product README:

```markdown
## Acknowledgements

Parts of this product's design were informed by studying two MIT-licensed open-source projects:

- **[career-ops](https://github.com/santifer/career-ops)** by [santifer](https://santifer.io) (MIT License).
  Studied for its job-evaluation rubric structure (blocks A–G, posting-legitimacy signals,
  compensation-reliability tiers), application-tracker state machine and canonical-write-path design,
  liveness/repost/cross-listing detection, anti-fabrication source-of-truth rules, follow-up cadence
  logic, and statistically honest funnel analytics. Concepts were adapted for a product-manager
  audience; no code was copied. career-ops itself credits srbhr/Resume-Matcher (Apache-2.0) as the
  inspiration for its skill-gap classification pattern.

- **[hiring-agent](https://github.com/interviewstreet/hiring-agent)** by InterviewStreet (HackerRank)
  (MIT License). Studied for its resume-parsing pipeline (PDF → markdown → per-section LLM extraction
  with schema enforcement), LLM-output normalization and repair patterns, anchored scoring rubrics
  with fairness constraints, and score-validation/clamping logic. Concepts were adapted; no code was
  copied.

Both projects are excellent; if you are an engineer running your own job search from a terminal,
use career-ops directly.
```

---

*Companion documents: [MANIFEST.md](MANIFEST.md) (file catalog + mining queue), [EDGE_CASES.md](EDGE_CASES.md) (case-by-case verdicts with evidence).*
