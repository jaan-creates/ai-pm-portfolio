# PROVENANCE.md — Daybreak (Morning Brief, Project 1)

> The reasoning behind this project that doesn't show up in the code or the docs.
> Written plainly. Where I don't actually know or can't verify something, it says so —
> this file is not trying to sound more finished than the project is.

## Where the operator profile actually came from

I went through roughly the last 500 emails in my own inbox and did the actual
judgment work myself: deciding what was noise and what mattered. The concrete finding
was narrower than "importance is a multi-signal thing" — it was a short list of
specific senders and patterns that were always noise: Splitwise settle-ups,
newsletters, and marketing mail that dresses itself up as urgent (a Cleartax ad
using an ITR-deadline hook, not an actual deadline). Those became the Layer 2 drop
rules in `priorities.md`.

The two-layer *structure* — Layer 1 (principles that judge any sender, including ones
I've never received mail from) versus Layer 2 (shortcuts for known, recurring
senders) — was not something I derived from the inbox audit. That packaging was
suggested by Claude Code after I gave it the real data and my findings. So the
honest split is: I did the substantive work of deciding what's actually important;
the model did the structural work of organizing that judgment into two layers. Layer
1's content (the "is this dated and does it need me" rules) reads as general
judgment criteria I wrote, not something traced back to a specific pattern I found
in the 500 emails the way the Layer 2 drop list is.

## What's implemented vs. what's prose

Confirmed by reading the actual code nodes in `Morning Debrief Email.json`, not
inferred. The `Assemble` node does this:

```js
const priorities = (grab('Priorities') || {}).priorities_text || '';
...
"OPERATOR PROFILE:\n" + priorities,
```

The whole `priorities.md` file is grabbed as one string and concatenated whole into
the Claude prompt, alongside emails, calendar, weather, and news. No parsing into
Layer 1 vs. Layer 2, no sequencing, no gating. `Build Email` only parses Claude's
JSON reply, computes cost, and renders HTML — it doesn't touch priorities logic at
all. So: the two layers are text in a markdown file. Nothing in the pipeline
enforces the ordering I wrote them in, and nothing would catch it if Claude ignored
part of the file on a given morning.

Given that, is code-level enforcement actually a good idea? Not uniformly. Layer 2
is a static list of senders with deterministic outcomes ("this sender → always
drop/collapse") — that doesn't need an LLM at all, and moving it into a real
pre-filter in the `Assemble` node (drop those emails before they're even sent to
Claude) would guarantee the rule is followed and cut token cost, instead of hoping a
prompt instruction gets honored. Layer 1 is different — judging a never-before-seen
sender requires reading and reasoning about content, which is exactly what needs the
LLM. So the fix isn't "enforce both layers in code," it's that Layer 2 is currently
mislabeled as the same kind of mechanism as Layer 1 when it's actually a much
simpler, code-appropriate one.

## Why the brain is thin — and it is

I looked at this directly rather than taking the earlier draft of this file's word
for it: "well-prompted summarizer" is accurate, not harsh. The test that matters is
whether the system could detect its own failure to curate. It can't. The entire
mechanism is one Claude call — concatenate everything into a string, ask it in the
prompt to "cluster across sources, score against the Bottleneck Test, pick exactly
ONE one_thing," and parse the JSON that comes back. The clustering and scoring are
*requested in prompt text*; there's no separable step — no cluster list, no
per-item score, no discard log — that I could point to and independently check
against the output. If Claude silently skipped the clustering instruction on a given
morning and just picked the most recent dated email as `one_thing`, the output shape
would be identical and nothing would surface the difference.

So "curation, not aggregation" is the goal the prompt is aimed at, not a property
the system structurally guarantees. That's a real limitation, not a reason to throw
the v1 out — a well-crafted single prompt is a legitimate first version. But
`CASE_STUDY.md` frames curation as the delivered differentiator, and that's stronger
than what's actually built.

## What I didn't seriously consider

Nothing was evaluated, as best I remember. No rules-based pre-filter before the LLM
call, no two-pass triage-then-deep-read, no code-level layer gating. `DECISIONS.md`
documents real rejected alternatives, but only at the implementation level (n8n vs.
hand-rolled code, HTTP node vs. n8n's native Anthropic node, one code node vs.
three). There's no equivalent record at the judgment-pipeline level because there
was no decision point — the single-call design was the first and only thing I
built, not one chosen among discarded alternatives. The multi-pass / tiered-retrieval
ideas in the v2 roadmap are deferred work, not things I built and rejected.

## The n8n and API wiring

Two specific things I don't currently know, tested directly rather than accepted on
faith:

- The cost math in `Build Email` uses `IN_RATE = 3/1e6, OUT_RATE = 15/1e6`. I don't
  know if these are still the correct Claude Sonnet per-token rates — they were
  written in around when I built this and I haven't re-checked them since.
- The Anthropic call uses an `httpHeaderAuth` credential stored in n8n's credential
  store. I don't know what header it actually sends (`x-api-key` vs. `Authorization:
  Bearer <key>`) — it's opaque to me because it lives in the credential store, not
  in anything I've read recently.

Both are real, current gaps, not resolved ones. What I can still defend without
re-checking: why "Always Output Data" is toggled on for the Calendar node
specifically — n8n halts a run by default when a node returns zero items, so a quiet
calendar day (no events) would otherwise kill the whole brief before it reaches
Claude. That setting forces an empty placeholder item instead, so the rest of the
workflow still runs.

## Has this actually run for real?

Yes, it runs every day. I'm not able to prove that from the repo itself, and I'm
fine with that being the honest final state: there's no raw execution log,
screenshot, or pinned n8n execution data committed anywhere, so a reviewer reading
just the files has to take "it runs daily" on my word, not on anything verifiable in
this directory. The cost figure in `COSTS.md` (~10,686 input / ~793 output tokens,
~$0.044/run, dated 2026-07-03) and the tuning-log entry in `DECISIONS.md` dated
2026-07-12 after a 3-email audit are the closest things to evidence — specific,
dated, falsifiable claims rather than a vague "it works" — but they're still claims,
not artifacts.

Two things worth fixing regardless of provenance: the committed
`Morning Debrief Email.json` still has a live OpenWeatherMap key and a live
NewsData.io key hardcoded in plaintext in the node URLs, which contradicts
`DECISIONS.md`'s stated policy that secrets never get committed. Both are free-tier,
low-severity keys, but they're exposed if this repo is ever made public and should
be rotated and moved to n8n's credential store like the other integrations already
are.
