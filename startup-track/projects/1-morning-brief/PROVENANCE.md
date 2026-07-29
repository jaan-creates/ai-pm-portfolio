# PROVENANCE.md — Daybreak (Morning Brief, Project 1)

> The reasoning behind this project that doesn't show up in the code or the docs.
> Written plainly. Where I don't actually know or can't verify something, it says so —
> this file is not trying to sound more finished than the project is.

## Where the operator profile actually came from

I pulled roughly the last 500 emails from my own inbox (through n8n's Gmail node —
not manually) and fed them to an LLM. The LLM proposed the two-layer structure that
ended up in `priorities.md`: Layer 1, principles that judge any sender including ones
I've never received mail from; Layer 2, shortcuts for senders I get mail from
repeatedly (Splitwise, newsletters, marketing I always drop).

I don't have the specific reasoning the LLM gave for why one layer wasn't enough.
That exchange wasn't saved anywhere, and I can't reconstruct it now. So the honest
version is: this wasn't me independently discovering that "importance is multiple
signals that have to be combined" through my own analysis. It was an LLM synthesizing
a known-sender/unknown-sender split after I gave it real data, and I kept the
structure because it made sense and matched what I actually wanted dropped. I did not
personally notice some inbox pattern and go build a layer for it — the structure came
from the model, not from me.

## What's implemented vs. what's prose

The two layers (five sections total in the current file, counting tone/identity/time
window) are **text in a markdown file, nothing else.** There is no code that enforces
them. No routing logic, no gating, no "if Layer 1 passes, check Layer 2." At runtime,
the whole `priorities.md` file gets concatenated with the day's emails, calendar,
weather, and news into one string, and that string goes to Claude in a single API
call. Claude reads it all as one blob and produces JSON in one holistic pass.

The "layers" are a writing device for organizing my instructions to the model —
useful for me when editing the file, meaningless to the runtime. Claude doesn't
"execute" Layer 1 before Layer 2 in any verifiable sense. I have never checked a real
Claude output against `priorities.md` line by line to confirm the model actually
followed the ordering I wrote. I infer it's working because the emails I don't want
mostly don't show up — that's not the same as verifying the mechanism.

## Why the brain is thin — and it is

"Curation, not aggregation" is the thesis of this whole project. Mechanically, what
that thesis rests on right now is **one well-crafted prompt.** There's no separate
clustering step, no scoring step, no intermediate representation I can inspect
between "raw inbox" and "final JSON." Architecturally this is close to a
well-prompted summarizer — the same category as a hundred other inbox-digest tools —
not a distinct judgment mechanism. If Claude ignored half of `priorities.md` on a
given morning, nothing in the pipeline would catch it or even surface that it
happened, because the only artifact that exists is the final email.

So: "curation, not aggregation" is the goal the prompt is written to reach, not a
property the system guarantees. I'm stating that as a limitation, not walking it
back — a well-crafted single prompt is a legitimate v1. But CASE_STUDY.md frames
curation as the delivered differentiator, and that's stronger than what's actually
built.

## What I didn't seriously consider

I did not evaluate alternative judgment architectures before building this one —
no rules-based pre-filter before the LLM call, no two-pass triage-then-deep-read,
no code-level layer gating. `DECISIONS.md` documents real rejected alternatives, but
only at the implementation level (n8n vs. hand-rolled code, HTTP node vs. n8n's
native Anthropic node, one code node vs. three). There's no equivalent record of a
rejected alternative at the judgment-pipeline level, because there wasn't one. The
single-call-to-Claude design was the first approach I built, not one chosen among
several I tried and discarded. The multi-pass / tiered-retrieval ideas in the v2
roadmap are deferred work, not things I built and rejected.

## The n8n and API wiring

No real gap here that I'm aware of. I can explain the mechanics I built — for
example, why "Always Output Data" is toggled on for the Calendar node specifically:
n8n halts a workflow run by default when a node returns zero items, so a quiet
calendar day (no events) would otherwise kill the entire brief before it reaches
Claude. Turning that setting on forces the node to emit an empty placeholder item
instead, so the rest of the workflow still runs. That's the kind of thing I
understand well enough to defend, not something I copied and hope works.

## Has this actually run for real?

Yes. The workflow has executed and sent real emails to myself — this isn't a
never-run design. The cost figure in `COSTS.md` (~10,686 input / ~793 output tokens,
~$0.044/run, dated 2026-07-03) is from an actual run, visible in the email output
itself, not a projected estimate dressed up as a measurement. It has run as a daily
automation I don't have to babysit — meeting or exceeding the README's stated ship
gate of 7 consecutive unattended weekday mornings.

What I can't independently verify from the repo alone, and want to be honest about:
there's no raw execution log, screenshot, or pinned n8n execution data committed
anywhere, so none of this is provable from the repo itself — only from my own
say-so. A reviewer reading just the files has to take the "it ran" claim on trust.

Two things worth fixing regardless of provenance: the committed
`Morning Debrief Email.json` still has a live OpenWeatherMap key and a live
NewsData.io key hardcoded in plaintext in the node URLs, which contradicts
`DECISIONS.md`'s stated policy that secrets never get committed. Both are free-tier,
low-severity keys, but they're exposed if this repo is ever made public and should
be rotated and moved to n8n's credential store like the other integrations already
are.
