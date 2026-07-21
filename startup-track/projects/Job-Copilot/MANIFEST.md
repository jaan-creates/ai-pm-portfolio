# MANIFEST — competitor autopsy file catalog

Date: 2026-07-21 · Repos cloned shallow into `_mined/` (gitignored, never committed)

| repo | source | commit | license |
|---|---|---|---|
| career-ops | github.com/santifer/career-ops | `8c941ee` | MIT |
| hiring-agent | github.com/interviewstreet/hiring-agent | `4db8655` | MIT |

**Excluded classes (per spec, not listed line-by-line):** `node_modules/`, lockfiles (`package-lock.json`, `flake.lock`, `go.sum`), binary/image assets (`fonts/`, `docs/*.{gif,png,jpg,svg}`, `docs/press/`, `web/public/`), test fixtures (`evals/fixtures/`, `tests/providers/fixtures` payloads), empty `.gitkeep` data dirs (`data/`, `output/`, `jds/`, `reports/`, `batch/logs/`), and `.github/` repo automation (16 workflow files + issue/PR templates — CI meta, no product logic).

**Domain tags:** `jd-fit` · `tracking` · `resume-scoring` · `outreach` · `analytics` · `similarity` · `oos` (out-of-scope: GitHub-signal, engineer-artifact, repo meta, i18n duplicates, infra).

---

## career-ops (783 files; JS/TS + Go + markdown prompts)

Architecture in one line: markdown prompt files in `modes/` are "the brain," executed by any agent CLI; root `.mjs` scripts are deterministic zero-token helpers; files (`data/applications.md`, `reports/`) are canonical storage, SQLite only a derived index.

### Root scripts — evaluation & fit

| path | purpose | domain |
|---|---|---|
| gemini-eval.mjs | Standalone JD evaluator on Gemini free tier (same rubric as modes) | jd-fit |
| ollama-eval.mjs | Standalone JD evaluator, fully local models | jd-fit |
| openai-eval.mjs | Standalone JD evaluator, any OpenAI-compatible endpoint | jd-fit |
| openrouter-runner.mjs | Shared OpenRouter model runner for eval scripts | jd-fit |
| eval-golden.mjs | Eval harness: scores rubric outputs against golden reports | jd-fit |
| classify-tier.mjs | Company tier classification (startup/scaleup/enterprise) | jd-fit |
| browser-extract.mjs | Extract JD text from pasted browser HTML | jd-fit |
| archive-posting.mjs | Snapshot JD text before posting dies | jd-fit |
| check-liveness.mjs | CLI: verify posting still open before spending eval tokens | jd-fit |
| liveness-core.mjs | Liveness heuristics core (shared) | jd-fit |
| liveness-api.mjs | Liveness via ATS APIs (zero-token) | jd-fit |
| liveness-browser.mjs | Liveness via headless browser fallback | jd-fit |
| salary-gap.mjs | Salary offer vs. benchmark gap calc | jd-fit |
| jd-skill-gap.mjs | JD-required skills vs. CV skills gap | similarity |
| role-matcher.mjs | Role title ↔ profile matching | similarity |
| match-star.mjs | Match STAR stories/achievements to JD requirements | similarity |
| invite-match.mjs (+.test) | Match incoming interview invite emails to tracker entries | tracking |
| scan.mjs | Zero-token job discovery orchestrator over providers/ | jd-fit |
| scan-ats-full.mjs | Full ATS company-list scan | jd-fit |
| find.mjs | Search tracker/pipeline entries | tracking |
| test-salary-filter.mjs | Tests for salary filtering | jd-fit |

### Root scripts — tracker & state machine

| path | purpose | domain |
|---|---|---|
| tracker.mjs | Canonical tracker table read/write (`data/applications.md`) | tracking |
| tracker-parse.mjs | Parse tracker markdown table | tracking |
| tracker-utils.mjs | Shared tracker helpers (atomic write, locking) | tracking |
| tracker-links.mjs | Link integrity between tracker/reports | tracking |
| tracker-aliases.json | Column/status alias map | tracking |
| set-status.mjs (+set-status-tests.mjs) | Status transitions with guards | tracking |
| normalize-statuses.mjs | Normalize freeform statuses to canonical set | tracking |
| merge-tracker.mjs | Merge divergent tracker copies | tracking |
| dedup-tracker.mjs | Dedupe tracker rows | tracking |
| detect-reposts.mjs (+.test) | Detect reposted/zombie listings | tracking |
| fingerprint-core.mjs | Job posting fingerprint (company+role+loc hash) for dedupe | similarity |
| reconcile-pipeline.mjs | Reconcile scan pipeline ↔ tracker | tracking |
| reserve-report-num.mjs | Atomic report-number reservation (concurrent runs) | tracking |
| add-entry.mjs | Append validated entry to tracker | tracking |
| verify-pipeline.mjs | Pipeline file integrity checks | tracking |
| tracker-writer-lock-tests.mjs | Write-lock behavior tests | tracking |
| tracker-columns-tests.mjs | Column schema tests | tracking |
| updater-migration-tests.mjs | System/user path separation guard tests | oos |
| normalize + templates/states.yml | Canonical state definitions (see templates below) | tracking |

### Root scripts — CV / resume generation

| path | purpose | domain |
|---|---|---|
| build-cv-html.mjs | CV markdown → ATS-safe HTML | resume-scoring |
| build-cv-latex.mjs | CV markdown → LaTeX | resume-scoring |
| cv-sections-core.mjs | CV section model (parse/reorder/select) | resume-scoring |
| cv-templates.mjs | Template registry/selection | resume-scoring |
| cv-sync-check.mjs | Detect CV variants drifting from master facts | resume-scoring |
| verify-cv-facts.mjs | Anti-hallucination: tailored CV claims ⊆ fact file | resume-scoring |
| generate-pdf.mjs | HTML → PDF via Playwright, page-budget aware | resume-scoring |
| generate-latex.mjs | LaTeX build pipeline | resume-scoring |
| extract-latex-content.mjs / patch-latex-content.mjs | Extract/patch LaTeX content blocks | resume-scoring |
| lib/latex-content.mjs / lib/latex-escape.mjs | LaTeX content model + escaping | resume-scoring |
| img-to-pdf.mjs | Image → PDF fallback | resume-scoring |
| generate-cover-letter.mjs | Cover letter generation from voice profile | resume-scoring |
| voice-dna.md | User writing-style profile consumed by cover/outreach prompts | resume-scoring |
| writing-samples/README.md | User writing samples dir doc | resume-scoring |
| application-answers.mjs | Draft answers to application form questions | resume-scoring |
| prepare-application.mjs | Assemble full application package | resume-scoring |
| profile-language.mjs | Detect output language per market | oos |
| tests/cv-optional-sections.test.mjs, tests/generate-pdf-page-budget.test.mjs, tests/output-language.test.mjs | CV pipeline edge-case tests | resume-scoring |

### Root scripts — outreach & replies (flag: not committed product scope)

| path | purpose | domain |
|---|---|---|
| followup-cadence.mjs (+.test) | Follow-up timing engine (when to nudge) | outreach |
| followup-seed.mjs (+followup-seed-tests.mjs) | Seed follow-up schedule on application | outreach |
| reply-matcher.mjs (+.test) | Match recruiter emails to applications | outreach |
| reply-watch.mjs | Watch inbox exports for replies | outreach |
| paste-reply.mjs (+paste-reply-tests.mjs) | Parse pasted recruiter reply → status update | outreach |
| agent-inbox.mjs (+agent-inbox-tests.mjs) | Queue of agent-proposed actions for human review | outreach |

### Root scripts — analytics & quality

| path | purpose | domain |
|---|---|---|
| stats.mjs (+tests/stats.test.mjs) | Tracker funnel stats | analytics |
| funnel-velocity.mjs | Stage-to-stage velocity metrics | analytics |
| analyze-patterns.mjs | Pattern mining over outcomes (what gets interviews) | analytics |
| process-quality.mjs (+.test) | Data-hygiene / process quality score | analytics |
| assessment-log.mjs | Log of assessments/tests received | analytics |
| build-dashboard.mjs | Build static dashboard from tracker | analytics |
| upskill.mjs | Skill-gap → learning suggestions | analytics |

### Root scripts / files — infra & meta (not mined)

| path | purpose | domain |
|---|---|---|
| update-system.mjs, doctor.mjs, cops, manifesto.mjs, plugin-audit.mjs, plugin-install.mjs, plugins.mjs, validate-plugin-registry.mjs, validate-portals.mjs, verify-portals.mjs, validate-system-paths-coverage.mjs, test-all.mjs, test-trust-validator.mjs | Self-update, env doctor, launcher, plugin infra, portal config validation, test runners | oos |
| package.json, Dockerfile, docker-compose.yml, flake.nix, renovate.json, release-please-config.json, VERSION, CITATION.cff | Build/packaging config | oos |
| AGENTS.md, CLAUDE.md, CODEX.md, GEMINI.md, KIMI.md, OPENCODE.md | Multi-CLI entry redirects to canonical agent instructions | oos |
| README.md ×15 translations, MANIFESTO.md, GOVERNANCE.md, CONTRIBUTING.md, CONTRIBUTORS.md, MAINTAINERS.md, CODE_OF_CONDUCT.md, SECURITY.md, SUPPORT.md, TRADEMARK.md, LEGAL_DISCLAIMER.md, SIGNATURES.md, CHANGELOG.md | Repo meta/community docs | oos |
| ARCHITECTURE.md, DATA_CONTRACT.md | Design docs — **read for architecture notes** (system/user layer, files-canonical doctrine) | all |
| docs/ (SETUP, FAQ, CUSTOMIZATION, PLUGINS, SCRIPTS, FREE_TIER, RUNNING_ON_A_BUDGET, SUPPORTED_CLIS, SUPPORTED_JOB_BOARDS, APPLY_AUTOFILL, local-parser-cookbook, REVIEWING, PLUGIN_REVIEW, CODEX) | User/contributor docs; budget + autofill docs inform cost-guard mining | mixed |
| seeds/vc-portfolios.mjs | Seed list of VC portfolio company boards | oos |
| scaffolder/ (bin, package.json, README) | npx create scaffolder | oos |
| .opencode/, .claude-plugin/ | CLI-specific plumbing | oos |

### modes/ — the prompt layer (34 root prompts; core mining target)

| path | purpose | domain |
|---|---|---|
| modes/_shared.md | **Scoring core**: 1–5 scale anchors, archetype detection, legitimacy signals, global rules | jd-fit |
| modes/oferta.md | **Single-JD evaluation**: A–G assessment blocks → structured report | jd-fit |
| modes/ofertas.md | Batch multi-JD evaluation | jd-fit |
| modes/deep.md | Deep-dive company/role research mode | jd-fit |
| modes/scan.md | Discovery mode prompt (wraps scan.mjs) | jd-fit |
| modes/auto-pipeline.md | End-to-end autonomous pipeline mode | jd-fit |
| modes/pipeline.md | Pipeline triage prompt | tracking |
| modes/tracker.md | Tracker maintenance prompt | tracking |
| modes/add.md | Add entry prompt | tracking |
| modes/update.md | Update entry prompt | tracking |
| modes/apply.md | Application preparation mode | resume-scoring |
| modes/cover.md | Cover letter mode | resume-scoring |
| modes/latex.md / modes/latex-tex.md / modes/pdf.md | CV artifact build modes | resume-scoring |
| modes/expand.md | Expand CV bullets with evidence | resume-scoring |
| modes/project.md | Project/portfolio artifact prompt | oos (engineer-artifact) |
| modes/email.md | Outreach email drafting | outreach |
| modes/contacto.md | Contact-finding mode | outreach |
| modes/followup.md | Follow-up drafting mode | outreach |
| modes/reply-watch.md | Reply triage mode | outreach |
| modes/agent-inbox.md | Agent-inbox review mode | outreach |
| modes/batch.md | Batch application mode | resume-scoring |
| modes/interview.md, interview-prep.md, interview-redflag.md, modes/interview/{README,debrief,plan,practice}.md | Interview prep suite | oos (not in product scope) |
| modes/offer-prep.md, oferta vs offer distinction | Offer negotiation prep | oos |
| modes/patterns.md | Outcome pattern analysis prompt | analytics |
| modes/titles.md | Title-variant expansion for search | similarity |
| modes/training.md, modes/upskill.md | Upskilling modes | analytics |
| modes/heuristics/recruiter-side.md | Recruiter's-eye heuristics ("how the other side reads you") | jd-fit |
| modes/regional/eu-swe.md | Regional market heuristics | oos |
| modes/_profile.template.md, _custom.template.md | User profile/custom-mode templates | jd-fit |
| modes/README.md | Modes docs | oos |
| modes/{ar,da,de,es,fr,hi,id,it,ja,ko,pl,pt,ru,tr,ua,zh,zh-TW}/ (~99 files) | Translated duplicates of core modes | oos (i18n) |

### providers/ — job source adapters (67 files)

| path | purpose | domain |
|---|---|---|
| providers/_http.mjs | Shared HTTP client: timeouts, retries, rate handling | jd-fit |
| providers/_trust-validator.mjs | Posting legitimacy/trust validation | jd-fit |
| providers/_registry.mjs | Provider registry/dispatch | jd-fit |
| providers/_html-entities.mjs | HTML entity decoding for JD text | jd-fit |
| providers/_types.js | Provider type contracts | jd-fit |
| providers/local-parser.mjs | Parse locally-saved JD files | jd-fit |
| providers/{greenhouse,ashby,lever,workday,smartrecruiters,successfactors,bamboohr,teamtailor,breezy,recruitee,personio,jobvite,rippling,workable,phenom,oraclecloud,csod,avature,radancy,jibeapply,pinpoint,comeet,beesite,softgarden,gem,...}.mjs | Per-ATS API adapters (~30) | oos (portal-specific) |
| providers/{remoteok,remotive,weworkremotely,himalayas,jobicy,justjoin,nofluffjobs,solidjobs,landingjobs,larajobs,jobspresso,nodesk,workingnomads,echojobs,hackernews,themuse,thehub,wttj,getonbrd,glints,jobstreet,meituan,tencent,alibaba,amazon,ibm,dassault,deutschebahn,hecklerkoch,rheinmetall,tkms,arbeitnow,arbeitsagentur,higheredjobs,4dayweek,agentic-jobs}.mjs | Per-board adapters (~36) | oos (portal-specific) |
| tests/providers/*.test.mjs (~60) | Adapter tests; `ats-ssrf-hardening.test.mjs` documents SSRF guards | oos except SSRF/hardening tests → jd-fit |

### templates/, evals/, examples/, batch/, config/

| path | purpose | domain |
|---|---|---|
| templates/states.yml | **Canonical application state machine definition** | tracking |
| templates/benchmarks.yml | Salary/market benchmark data | jd-fit |
| templates/cv-template.html /.tex /.zh-minimal.html, resume-template.html | ATS-safe CV templates | resume-scoring |
| templates/cover-letter-template.html | Cover letter template | resume-scoring |
| templates/portals.example.yml | Portal watch-list config example | jd-fit |
| templates/blacklist.example.md | Company blacklist example | jd-fit |
| templates/README.md | Template docs | oos |
| evals/README.md, evals/golden/*.json (10) | Golden eval reports for rubric regression (fixtures excluded from listing) | jd-fit |
| examples/{cv-example,resume-example,sample-report,ats-normalization-test,article-digest-example}.md, examples/dual-track-engineer-instructor/*, examples/latex-tex/* | Worked examples incl. golden report shape | resume-scoring / jd-fit |
| batch/batch-prompt.md, batch-runner.sh, batch/README.md | Batch apply loop | resume-scoring |
| config/{profile,plugins,cv-facts}.example.{yml,json} | User config examples; cv-facts = fact-file schema for anti-hallucination | resume-scoring / jd-fit |

### web/ — hosted-style Next.js UI (143 files; architecture reference for PM-native app)

| path | purpose | domain |
|---|---|---|
| web/src/lib/core/states.ts | State machine as used by UI | tracking |
| web/src/lib/core/{pipeline,scan,discover,portals,run-registry,safe-write}.ts | Core ops wrapped for web: pipeline, scanning, atomic writes | tracking / jd-fit |
| web/src/lib/apply/{extract,prefill→fill via api,greenhouse,agent-interpret,cv,diagnose,drive,issue,session}.ts | Semi-automated form-fill assist (human clicks submit) | resume-scoring |
| web/src/lib/{tracker-table.mjs,inbox.ts,explore.ts,explore-ai.ts,explore-cost.ts,company.ts,clis.ts,career-ops.ts,cv/quality.ts,report/report.ts,report/logbuf.ts,report/FORMAT.md,format.ts,fonts.ts,cn.ts,nav-items.ts,clean-chips.mjs} | UI-side data layer: tracker table, inbox triage, AI explore + cost meter, CV quality, report shape | tracking / analytics |
| web/src/app/api/* (33 routes: tracker/delete, status, pipeline, followups, cv, cv-pdf, explore, apply/*, run, runs/save, usage, doctor, memory, assistant, portals, report/shape, logo, version, whats-new, clis) | Local REST layer over file store | tracking / analytics |
| web/src/app/{page,jobs,jobs/[id],pipeline,pipeline/[id],explore,apply,cv,config,analytics,portals}/*.tsx | Pages: today-dashboard, job detail, pipeline board, explore, apply assist, CV editor, analytics | tracking / analytics |
| web/src/components/** (~60: today-dashboard, decision-card, follow-up-card, inbox-triage, triage-row, shortlist-tray, quick-evaluate, score-methodology, report-view, status-select, pipeline-view, cv-editor, cv-ingest, explore/*, jobs/*, cost-badge, usage-meter, ui/*) | UI components; decision-card + score-methodology + cost/usage meters are PM-UX reference | tracking / analytics |
| web/{package.json,next.config.mjs,postcss.config.mjs,tsconfig.json,README,CHANGELOG,test-clean-chips.mjs} | Web app config | oos |

### dashboard/ — Go TUI (38 files)

| path | purpose | domain |
|---|---|---|
| dashboard/main.go, dashboard/internal/** | Terminal UI for browsing pipeline/tracker (read-only views) | oos (CLI-artifact; logic duplicated from files layer) |
| dashboard/open_*.go (+tests), go.mod | Cross-platform open-URL helpers | oos |

### plugins/ (24 files)

| path | purpose | domain |
|---|---|---|
| plugins/_engine.mjs, _lock.mjs, _net.mjs, _registry.mjs, _types.js | Plugin runtime: sandboxing, locking, net allowlist | oos (infra; net-allowlist pattern noted in arch) |
| plugins/{apify,gmail,notion}/* , plugins/_template/*, plugins-registry/*.json (10) | Gmail reply ingestion, Notion sync, Apify scrape plugins + registry | outreach (gmail) / oos |

---

## hiring-agent (28 files; Python + Jinja)

Pipeline: PDF → markdown (PyMuPDF) → per-section LLM parse → (GitHub enrich) → weighted score → explainable evaluation.

| path | purpose | domain |
|---|---|---|
| evaluator.py | Orchestrator: parse → enrich → score → report | jd-fit |
| pdf.py | PDF → markdown conversion wrapper | resume-scoring |
| pymupdf_rag.py | Vendored PyMuPDF markdown extractor (layout-aware) | resume-scoring |
| prompt.py | Prompt assembly from Jinja templates | jd-fit |
| llm_utils.py | LLM call plumbing: retries, JSON parsing/repair | jd-fit |
| models.py | Pydantic schemas = output contracts for every LLM call | jd-fit |
| transform.py | LLM JSON → resume model normalization | resume-scoring |
| score.py | Weighted composite scoring of parsed resume | resume-scoring |
| config.py | Weights/models/env config | jd-fit |
| github.py | GitHub profile/repo signal enrichment | oos (GitHub-signal) |
| prompts/template_manager.py | Template loading/rendering | jd-fit |
| prompts/templates/system_message.jinja | Section-parser system prompt | jd-fit |
| prompts/templates/{basics,work,education,skills,projects,awards}.jinja | Per-resume-section extraction prompts with schemas | resume-scoring |
| prompts/templates/resume_evaluation_criteria.jinja | **Scoring rubric prompt** (criteria + anchors) | resume-scoring |
| prompts/templates/resume_evaluation_system_message.jinja | Evaluator persona/system prompt | resume-scoring |
| prompts/templates/github_project_selection.jinja | GitHub repo selection prompt | oos (GitHub-signal) |
| requirements.txt, README.md, CONTRIBUTING.md, LICENSE | Meta | oos |

---

## Mining queue (strict order)

1. **JD parsing + fit assessment** — career-ops: `modes/_shared.md`, `modes/oferta.md`, `modes/ofertas.md`, liveness trio, `browser-extract.mjs`, `providers/_http.mjs`, `_trust-validator.mjs`, eval scripts, `eval-golden.mjs`; hiring-agent: `evaluator.py`, `pdf.py`, `llm_utils.py`, `models.py`, `prompt.py`
2. **Tracker state machine** — `templates/states.yml`, `set-status.mjs`, `normalize-statuses.mjs`, `dedup-tracker.mjs`, `detect-reposts.mjs`, `fingerprint-core.mjs`, `merge-tracker.mjs`, `reconcile-pipeline.mjs`, `reserve-report-num.mjs`, `tracker*.mjs`, `web/src/lib/core/states.ts`
3. **Prompt & rubric patterns** — hiring-agent `prompts/templates/*` + `prompt.py`; career-ops `modes/_shared.md`, `oferta.md`, `apply.md`, `cover.md`, `evals/golden/`, `examples/sample-report.md`
4. **Scorer / tailoring** — `cv-sections-core.mjs`, `verify-cv-facts.mjs`, `cv-sync-check.mjs`, `build-cv-*.mjs`, `generate-pdf.mjs`, `match-star.mjs`, `jd-skill-gap.mjs`, `role-matcher.mjs`; hiring-agent `score.py`, `transform.py`
5. **Analytics** — `stats.mjs`, `funnel-velocity.mjs`, `analyze-patterns.mjs`, `process-quality.mjs`, `salary-gap.mjs`, web analytics page
6. **Outreach (flagged)** — `followup-cadence.mjs`, `followup-seed.mjs`, `reply-matcher.mjs`, `paste-reply.mjs`, `invite-match.mjs`, `agent-inbox.mjs`, `modes/{email,followup,contacto}.md`

Out-of-scope files (tagged `oos` above) are never mined.
