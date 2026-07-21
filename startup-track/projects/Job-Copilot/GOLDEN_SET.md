# GOLDEN_SET.md — Eval harness specification for the PM rubric
Version 0.1 · Frozen after Step 2 passes (then it becomes the permanent regression suite: every future prompt, weight, or model change re-runs it).

## Design principles
1. Each case targets ONE named failure mode. A case that tests nothing specific is padding.
2. Each case = 1 JD + a candidate **trio**: **S**trong (true fit) · **D**ecoy (keyword-rich, well-written, evidence-poor — the case's trap made flesh) · **W**eak (honest misfit).
3. **Labels are rank order + margins, not absolute scores.** Absolute numbers mean nothing pre-calibration.
4. **Decoys must be written as well as Strongs.** Their weakness lives only in evidence content. If a decoy reads sloppier than its Strong, the eval tests prose detection, not fit detection — rewrite it.
5. Labels are ground truth set by the evaluator (this spec + operator review). The system under test never edits labels. (Runbook rule 4.)

## The 10 cases

| # | Failure mode under test | JD (synthetic; mix Bengaluru/remote/global) | Strong | Decoy | Weak | Case-specific assertions |
|---|---|---|---|---|---|---|
| G1 | Program-manager-in-PM-clothing | "Technical Product Manager" title; body: 80% release coordination, dependency mgmt, ceremonies; thin ownership language | Senior *program* manager, excellent delivery evidence | Product PM whose resume plays up delivery vocabulary to mirror the JD | Junior scrum master | Rubric must classify A6 + flag; for a product-career operator this JD itself gets the A6 warning. S ranks 1st **on this JD** (it's genuinely a program role) — the trap is scorers that reward the *product* PM for keyword mirroring |
| G2 | Vanity-metric growth | Growth PM, subscription app: activation/retention ownership, experiment velocity | PM with owned-metric chains (12%→18%, 9 experiments, guardrails) | PM citing "increased engagement 3×" and company-level growth with zero ownership evidence | Solid B2B platform PM, no growth work | D's Data&Metrics section must score ≤ 60 despite metric *numbers* appearing throughout |
| G3 | Tool-name stuffing on technical PM | Platform PM: public API product, developer users, deprecation policy | PM with API versioning/deprecation decisions, developer-user discovery | Non-technical PM whose skills section mirrors every tool in the JD ("Kafka, gRPC, OpenAPI") with no usage stories | Strong consumer-UX PM | S3 may be HIGH for D; composite must still put D ≥12 under S (tests S3 weight cap + terminology-without-evidence refusal) |
| G4 | GenAI-buzzword vs AI-product | AI PM: ML-powered risk product; eval design, model tradeoffs, failure modes | PM who shipped ML product: named eval metrics, precision/recall tradeoff decision, incident handling | PM with "GenAI strategy," ChatGPT-tooling projects, prompt-engineering workshops | Classic CRUD-product PM | Confusion rule 5 must appear in D's `confusion_flags` |
| G5 | Seniority inflation | **Lead** PM: area strategy, multi-team roadmap, mentors 2 PMs | True Lead: strategy authored + adopted, cross-team, grew APMs | "Senior PM" title, 6yrs, but evidence = single-feature scope throughout | Mid-level PM, honest about scope | D's Role&Seniority ≤ 60; ladder anchors (§2) must be cited in evidence |
| G6 | Domain over/under-weighting | Fintech Domain PM (A5): lending product, RBI compliance named in JD | PM with regulated-fintech evidence: named compliance regime work, domain metrics | Excellent generalist PM (strongest raw resume in the whole set) with zero regulated-domain work | Fintech *analyst* pivoting to PM | The hard one: D is a genuinely great PM. Correct behavior = D scores well overall but S > D by ≥8 on THIS JD via A5 domain weighting. If D > S, domain weight is too low; if D ≤ W, too high |
| G7 | Certification alphabet | Hybrid PM/PO JD at an agile-heavy services co | PM with outcome evidence in agile-shop context | CSPO + SAFe + PSM-II + PMP, ceremonies fluently described, no outcome chains | New CS grad with internships | Confusion rule 4 flagged; D's certifications earn ≈0 outside Skills/tools |
| G8 | Logo blindness (fairness probe) | Founding PM at seed-stage startup: breadth, 0→1, scrappiness | Startup PM: 0→1 evidence, wore-many-hats with outcomes | Big-tech PM, prestigious employers (pre-anonymization), narrow scope, process-heavy | Career consultant, no shipped product | Run D twice: with real logos and anonymized. Score delta ≤2 (validates the anonymization pipeline is actually load-bearing) |
| G9 | Keyword mirror (pure S3 attack) | Any A1 JD with distinctive phrasing | Normal strong fit, own vocabulary | Resume that verbatim-mirrors ≥15 JD phrases; every mirrored phrase evidence-free | Adjacent-role marketer | D must trigger terminology-without-evidence refusals; D composite ≥15 under S. This is the case that catches "ATS-optimization" snake oil |
| G10 | Missing hard must-have | A1 JD, strong fit possible, but ONE explicit must-have (e.g., "enterprise B2B with 6-month sales cycles — required") | Has the must-have with modest polish elsewhere | Outshines S on every section EXCEPT the must-have (missing) | Junior with the must-have only | Must-have double-weighting in S2 must drag D's composite below S. Gap report for D must surface the must-have as THE gap, phrased as a question |

## Expansion instructions (for Claude Code)
- Expand each JD to 350–500 words of realistic posting prose (responsibilities, requirements with explicit must/nice language for G10-style items, company blurb). Market mix: ~half India-market (Bengaluru/Mumbai/remote-India), half global-remote.
- Expand each candidate sketch to a 1-page resume in the same markdown structure as `resume.master.md` (so the harness exercises the real parsing path). 30 resumes total.
- Re-read design principle 4 before writing any decoy. Then re-read it after.
- Do NOT include expected labels anywhere inside JD or resume text. Labels live only in `golden/labels.json`.

## Pass gates (all must hold for rubric v0.1 → v1.0)
1. **Rank order** S > D > W in ≥9/10 cases; any miss requires a written anchor/weight fix + full re-run (see iteration rules). G1's special ordering per its assertion.
2. **Decoy margin:** composite(S) − composite(D) ≥ 10 in every passed case (≥8 acceptable for G6 only).
3. **Stability:** every candidate×JD scored twice; |run1 − run2| ≤ 5 on all 60 scorings. Violations count as case failures.
4. **Evidence integrity:** zero nonzero section scores without a verbatim resume quote (spot-check 10 random score JSONs by hand).
5. **Fairness probe (G8):** logo-swap delta ≤ 2.
6. **Case-specific assertions** (rightmost column) all hold.

## Runbook — executing Step 2
1. **Expand** (session 1): Claude Code generates the 10 JDs + 30 resumes + `labels.json` per the table. Operator skims 2–3 trios and answers one question: "would I be fooled about which is the decoy from writing quality alone?" If yes → decoys pass principle 4; if the decoy is *identifiable by prose*, regenerate it.
2. **Harness** (session 1): script loops candidates×JDs×2 runs through the critic prompt (with PM_RUBRIC.md loaded), collects Score JSONs, emits `golden/report.md`: rank table, margins, stability deltas, gate pass/fail, per-case assertion results.
3. **Run + iterate** (sessions 2–n): on any gate failure, fix the RUBRIC (anchors, weights, confusion rules) — never the labels, never the resumes — log the change in PM_RUBRIC.md changelog with the motivating case, and re-run the FULL set (partial re-runs hide regressions).
4. **Label-change exception:** if iteration reveals a label is genuinely wrong (the spec mislabeled reality), changing it requires a written justification in `golden/labels_changelog.md` and operator sign-off. Expected frequency: ~zero. If you're changing labels more than once, the rubric isn't failing — the evaluator is rationalizing.
5. **Freeze:** all gates green → rubric becomes v1.0, golden set frozen as the permanent regression suite, and the result goes back to Builder HQ as one convergence log line (pass, iterations needed, what changed). THEN the PRD, with "passes the frozen golden set" as its first acceptance criterion.

## What this deliberately does not test (so nobody pretends it does)
Real-world callback prediction (that's Phase-1 calibration on the operator's real past applications + the 4-week dogfood), JD parsing robustness (edge-case suite, Phase D), and cost/latency (later). The golden set proves the instrument discriminates and resists traps — necessary, not sufficient.
