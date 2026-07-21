# PM_RUBRIC.md — Scoring instrument for job-copilot
Version 0.1 (pre-validation — becomes 1.0 only when GOLDEN_SET.md passes)
Extends CRITIC_MODE_PROMPT.md: this file supplies the archetype logic, named anchors, and confusion-pair rules its S1 table references. Weights remain the only calibration tunable; anchors change only via the iteration rules in GOLDEN_SET.md §Runbook.

---

## 1. Archetype classification (runs first, on the JD)

Classify every JD into a primary (and optional secondary) archetype. Archetype sets the section weight profile. Evidence for classification = the JD's actual responsibilities, not its title.

| Archetype | JD tells | Weight shifts (from base) |
|---|---|---|
| A1 Core Product PM | owns product area, discovery→delivery, roadmap, user outcomes | base profile |
| A2 Growth PM | funnels, activation/retention/monetization, experimentation velocity | Data & metrics +7, Product sense +3, Domain −5, Strategy −5 |
| A3 Platform / Technical PM | APIs, internal platforms, developer users, system constraints | Skills/tools +5, Execution +5, Product sense −5 (user = developer), Domain −5 |
| A4 Data / AI PM | ML/AI product lifecycle, model behavior, eval, data products | Data & metrics +8, Skills/tools +4, Strategy −4, Domain −8 (unless AI-domain JD) |
| A5 Domain PM | regulated or deep vertical (fintech, health, commerce ops) | Domain +10, Product sense +2, Skills/tools −6, Strategy −6 |
| A6 Program-heavy hybrid | delivery coordination, ceremonies, cross-team timelines dominate | **Do not silently score.** Flag `archetype: A6` prominently — this JD may not be a product role. Role-alignment section caps at 60 for a product-career candidate unless the JD shows genuine ownership of product outcomes. |

Base weights (A1): Role & seniority 15 · Domain 10 · Product sense 15 · Execution 15 · Data & metrics 15 · Strategy 10 · Leadership 12 · Skills/tools 8. Shifts are zero-sum; floor any section at 4.

## 2. Seniority ladder anchors (Role & seniority section)

- **Lead PM (target level):** owns strategy for a product area; influences roadmap across multiple teams; evidence of mentoring/growing PMs; makes and is accountable for prioritization tradeoffs at area level.
- **Senior PM:** owns a product/feature area end-to-end including its metric; drives cross-functional execution; contributes to (does not set) area strategy.
- **PM / below:** executes a defined roadmap; owns features, not outcomes.
- Scoring rule: match the JD's *actual* level (from responsibilities, not title — titles inflate) against the resume's *evidenced* level. One-level stretch = 70–85 band. Two levels = ≤55. Overqualified by >1 level = flag, score honestly, note retention risk in prose.

## 3. Named anchors per section
Format: ✚ earns the 90–100 band (when quoted from resume) · ✖ earns nothing or deducts — recognize and refuse these.

**Product sense & customer insight**
- ✚ "identified churn driver via 30 user interviews; killed planned feature, redirected to X; retention +6pts"
- ✚ shipped-thing + user-problem + decision-they-made + outcome, in one traceable chain
- ✖ "passionate about user experience" · "customer-centric mindset" · lists of features shipped with no problem or outcome attached
- ✖ discovery *process* vocabulary (personas, journey maps, JTBD) with no decision it changed

**Execution & delivery**
- ✚ "led 3-squad replatform, cut release cycle 6wk→2wk, delivered under a hard regulatory date"
- ✚ scope-tradeoff decisions named and owned ("cut X to protect launch date, shipped X in fast-follow")
- ✖ "ran standups/sprint ceremonies" — ceremony operation is not delivery leadership (the canonical filler anchor)
- ✖ "worked in agile environment" · certification lists standing in for delivery evidence

**Data & metrics fluency**
- ✚ "owned activation; moved 12%→18% through 9 experiments; defined guardrail metrics that caught a regression"
- ✚ named metric + owned it + mechanism + magnitude
- ✖ "data-driven decision maker" · company-level metrics the candidate rode ("company grew 3×") · dashboard-building as a proxy for metric ownership
- ✖ "familiar with A/B testing" — familiarity is not having *run and decided from* experiments

**Leadership & stakeholder influence**
- ✚ "influenced VP-level tradeoff against exec preference, with the memo/decision named" · "grew 2 APMs to PM"
- ✚ led-without-authority evidence: named conflict, named resolution, named outcome
- ✖ "collaborated with stakeholders" / "worked cross-functionally" — table stakes phrased as achievement
- ✖ people-management *titles* with no development or influence artifact

**Strategy & vision**
- ✚ "authored area strategy adopted for FY25; killed two legacy bets; reallocated 40% of roadmap" — direction *others executed*
- ✖ "contributed to strategy discussions" · vision statements with no resourcing or kill decision attached

**Domain fit**
- ✚ regulated/vertical specifics: named compliance regimes, domain metrics, domain-specific failure modes handled
- ✖ industry keywords absorbed from an employer's sector without domain *work* evidence

**Skills / tools coverage**
- ✚ tool + what was done with it that mattered ("SQL: built the retention cohort analysis that reprioritized Q3")
- ✖ tool lists · "exposure to" · tools named in JD mirrored into resume without a usage story (feeds the S3-without-evidence refusal rule)

## 4. Confusion-pair rules (explicit disambiguation — the scorer must apply these by name)

1. **Product vs Program Manager:** ownership of *what/why* (problem selection, outcome accountability) vs *when/how* (coordination, timeline, dependencies). A resume can be senior program management excellence and still score ≤55 on role alignment for a product JD. Look for problem-selection evidence, not delivery evidence, to break the tie.
2. **ARR owned vs influenced:** "owned $4M ARR line" requires pricing/packaging/roadmap authority evidence; revenue the candidate's feature merely touched = influenced → credit under Execution, not as ownership.
3. **"Launched X" vs "supported launch of X":** launched = accountable for outcome post-launch; supported = contributed. Post-launch metric ownership is the tiebreaker.
4. **Certifications vs outcomes:** CSPO/SAFe/PMP earn 0 in every section except Skills/tools, and there only when paired with applied evidence.
5. **AI-adjacent vs AI-product:** "used GenAI tools / built GPT wrapper demo" ≠ shipped ML/AI product decisions (model tradeoffs, eval design, failure-mode handling, data flywheel). A4 JDs require the latter for >70 on Skills/tools.
6. **Logo vs scope:** employer prestige earns nothing; scope and evidence earn everything. (Enforced structurally by anonymization — employer names are aliased before the scorer ever sees them.)

## 5. Operator personalization overrides (config, not rubric)
Kept in `config/operator_overrides.json` so the rubric stays portable:
```json
{
  "seniority_floor": "senior_pm",        // force verdict SKIP below this
  "comp_floor": null,                     // force SKIP if JD states comp below X
  "locations_allowed": ["<fill>", "remote"],
  "industry_blocklist": [],
  "must_have_vetoes": []                  // e.g. "no on-site relocation"
}
```
Overrides run AFTER scoring and can only force SKIP or annotate — they never inflate a score. (Fit truth and personal constraints are orthogonal judgments, same principle as fit-vs-legitimacy separation.)

## 6. Output additions to Score JSON
- `archetype`: {primary, secondary, evidence}
- `confusion_flags`: [rule numbers triggered, with the resume line that triggered each]
- `override_result`: {skipped: bool, rule: ""}

## Changelog
- 0.1 — initial instrument, pre-golden-set. Every anchor/weight change from here forward gets a line here with the golden-set case that motivated it.
