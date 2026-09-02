# Product and delivery workflow

## Sources of truth

- Jira: backlog, status, priority, dependencies, releases, bugs, and enhancements.
- GitHub: code, pull requests, CI, decisions, and releases.
- BUILD_PLAN.md: approved product and architecture baseline.
- CHANGELOG.md: shipped user-visible behavior.
- docs/status: weekly outcome snapshots.

## Board

Use the Jira project named **Save Here**, key **SH**, with:

`Inbox → Ready → In Progress → Validate → Done`

Additional states are `Blocked`, `Parked`, and `Won't Do`. At most two items may be active across In Progress and Validate.

## Priority

- P0: data loss, credential exposure, or severe security incident.
- P1: capture loss, unusable retrieval, or phase-gate blocker.
- P2: committed high-value work.
- P3: planned improvement.
- P4: someday/maybe.

For P2–P4:

`(User value + Risk reduction + Time criticality) × Confidence ÷ Effort`

Value is 1–5; risk and time criticality are 0–3; confidence is 0.5, 0.8, or 1; effort is 0.5, 1, 2, 3, 5, or 8 ideal days.

## Definition of Ready

- The user outcome and acceptance criteria are testable.
- Dependencies and risks are named.
- Required API/design decisions are recorded.
- The test approach is known.
- The item is five ideal days or smaller.

## Definition of Done

- Acceptance criteria and appropriate automated tests pass.
- Privacy, degraded behavior, cost, and observability are checked.
- Documentation and ADRs are current.
- The Jira item links its pull request and release.
- Mobile changes are validated on a real iPhone.
- No secret or private fixture entered Git.

Branches and pull requests start with the Jira key, such as `SH-12-durable-capture`.
