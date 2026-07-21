# Daniel JKLM-Ten
Product Manager, Applied ML · Remote (Berlin, UTC+1) · daniel.s4@example.invalid · linkedin.com/in/placeholder-g4s

## Summary
Product manager with 6 years shipping ML products in production. I've owned eval design, defended precision/recall operating points, and been on the bridge when a model failed. I speak data science fluently and I own the consequences of the models I ship.

## Experience

### Product Manager, Fraud ML — Sentinel Payments · Feb 2021 – Present · Remote
- Owned a real-time transaction-fraud model end to end; set the operating point at 0.92 precision / 0.61 recall after modelling the cost of a blocked good customer vs a missed fraud, and defended it to a sceptical risk committee.
- Designed the offline+online eval: a labelled holdout, weekly drift monitoring on feature distributions, and a guardrail alert that caught a 7-point precision drop from an upstream data change before it hit customers.
- Led incident response when a model update spiked false positives on a merchant segment; root-caused it to label leakage, rolled back within the hour, and added the segment to the eval slice so it couldn't recur.
- Built the feedback-to-label flywheel: analyst dispositions now flow back into training data, and model v4 cut false positives 22% at equal recall.

### Product Manager, ML Platform — Cartography Labs · Jun 2018 – Jan 2021 · Remote
- Shipped a content-classification model; owned the threshold decision and the human-review queue design for low-confidence predictions.
- Instituted a model-card + eval-readout ritual before any model shipped to production.

## Skills
ML product ownership · Eval design (offline/online, holdouts, drift) · Precision/recall tradeoff decisions · Model incident response & root-cause · Labelling & data flywheel · Working with data science

## Education
### M.Sc., Computer Science (ML) — Coastline University · 2016

## Certifications
- (none)

## Links
- Model-card writeups: example.invalid/g4s-notes
