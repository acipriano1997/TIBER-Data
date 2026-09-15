# Season Intelligence Event v1

Season Intelligence is the governed evidence layer for weekly football news, role/usage observations, injuries, depth-chart changes, scheme changes, transactions, and team context. It records what was knowable and how CCF is allowed to treat it; it does not own fantasy recommendations.

## Contract rules

- Facts, reporting, observations, and speculation are separate `fact_status` states.
- `model_treatment` is a separate axis. Source certainty never silently becomes recommendation authority.
- Every event carries `known_at`, provenance, source quality, confidence, affected entities, recheck timing, and the next evidence needed.
- Week-opening observations use prior protection: stable role evidence (snaps/routes/touches/goal-line/personnel/QB changes) can update faster than touchdowns, efficiency, or one-game yardage.
- Same-body-part recurrence, replacement-QB competence, defensive injuries, personnel usage, play-caller changes, volume, and turnover/short-field context are explicit mechanisms.
- The frozen weekly snapshot contains only events known by its `evidence_cutoff`.
- Later information is append-only in `deltas/`; it must never mutate the frozen snapshot.
- `supersedes_event_id` expresses a later refinement without deleting historical truth.
- Snapshot fingerprints are SHA-256 over canonical JSON containing `season`, `week`, `evidence_cutoff`, `themes`, and the ordered concatenation of all event shards.

## Week 1 2026 reference pack

`data/season_intelligence/2026/week_01/frozen-snapshot.json` freezes the post-MNF evidence state at 2026-09-15 06:48 ET. It references four event shards containing 24 promoted events and nine cross-week themes.

`data/season_intelligence/2026/week_01/deltas/2026-09-15.json` records Tuesday updates separately, including Zay Flowers' day-to-day status, Baltimore's receiver-depth transaction, Mansoor Delane's pending MRI after negative X-rays, and Omar Cooper Jr.'s week-to-week ankle status.

This pack is a governed seed/reference artifact, not authorization to scrape sources, fabricate state probabilities, or bypass downstream CCF calibration and recommendation ownership.
