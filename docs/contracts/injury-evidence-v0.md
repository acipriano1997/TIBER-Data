# Injury Evidence Contract v0

## Purpose

`injury-evidence-v0` is the governed TIBER-Data handoff shape for public, source-backed injury, availability, practice, mechanism, workload, travel, and environmental observations used by downstream injury/recovery forecasting.

It is an **evidence contract**, not a diagnosis contract. TIBER-Data does not infer an injury, severity, return date, fantasy impact, or medical clearance.

## Doctrine

1. Official injury designations and team statements are evidence, not privileged downstream model truth.
2. Observed facts, reported claims, and downstream inference remain separate.
3. Unknown observations are `null`, never silently coerced to `false`.
4. Every record preserves source identity, source issue time when available, retrieval time, raw-payload reference, raw-payload SHA-256, `observedAt`, `reportedAt`, and `knownAt`.
5. Downstream frozen-as-of consumers may only use records whose `knownAt <= as_of`.
6. Later corrections do not rewrite what was knowable earlier; correction/supersession lineage must be handled by the producing pipeline when live ingestion is added.
7. Video observations may record visible mechanism/function only. They are not imaging or confirmed diagnosis.
8. Downstream model output must never be re-ingested as source evidence without an independently sourced, governed record.
9. No private player medical data is implied or required by this contract.

## Evidence classes

Supported source kinds include official injury reports/transactions, team/coach/player statements, medical reporting, national and beat reporting, practice observations, video/game observations, workload data, travel data, weather data, and an explicit `other` class.

Supported claim families include body region, reported diagnosis/severity, availability, practice participation, mechanism, functional observation, public diagnostic-test reporting, treatment/device reporting, workload/recovery context, and narrative framing.

## Temporal contract

Each evidence record contains:

- `observedAt`: when the underlying event/observation occurred.
- `reportedAt`: when the source published or communicated the claim.
- `knownAt`: earliest timestamp TIBER can prove the record was available for model use.
- `source.sourceIssuedAt`: native source issue time where available.
- `source.retrievedAt`: TIBER retrieval time.
- `validFrom` / `validTo`: optional validity window for a claim such as practice/game status.

Validation fails if `knownAt < reportedAt`, `knownAt > retrievedAt`, or `validTo < validFrom`. The contract intentionally does not infer missing timestamps.

## Raw trace

Every record requires `rawPayloadRef` and a 64-character lowercase SHA-256. This is the immutable trace back to the raw source material. The contract does not itself claim the referenced payload has been admitted or promoted; producer governance remains responsible for that.

## Observed feature semantics

Mechanism/function fields are tri-state booleans: `true`, `false`, or `null` (unknown/not established). Examples include planted foot, external rotation, immediate stop, return to game, weight-bearing observation, boot/crutches/brace, practice participation, cutting/sprinting observation, workload restriction, expected active/inactive reporting, same-region recurrence reporting, and concussion-protocol reporting.

A value of `false` means the source/evidence establishes the negative. Missing support must be represented as `null`.

## Downstream boundary

TIBER-Forecast may transform this contract into a versioned model input and emit probabilistic diagnosis/severity/recovery/readiness scenarios. Those outputs remain inference. TIBER-Fantasy may display them with provenance and confidence but must preserve official state separately.

## Not yet implemented by this contract task

- live source adapters or scraping;
- licensed medical/news provider ingestion;
- raw payload storage layout;
- correction/supersession ingestion mechanics;
- empirical source-quality calibration;
- production promotion of any injury evidence artifact.

Those require separately governed source/provider work. This contract deliberately creates no synthetic evidence rows and widens no source-support claim.
