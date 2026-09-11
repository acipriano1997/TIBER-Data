# Injury Evidence v0 Contract Audit — 2026-09-11

## Scope

Audit of the new `src/contracts/v1/injuryEvidenceV0.ts` contract and its downstream handoff semantics.

## Task classification

- Contract task: **yes**
- Downstream handoff task: **yes**
- Data artifact / source ingestion task: **no**
- External dataset admission task: **no**

## Findings

### PASS — repository boundary
The change defines source-backed evidence vocabulary and provenance only. It does not implement diagnosis, recovery modeling, fantasy scoring, recommendation logic, or medical clearance. Those remain downstream inference responsibilities.

### PASS — no fabricated source coverage
No injury records, player facts, provider coverage claims, source credentials, or synthetic historical rows are added. The contract does not imply that any listed source kind is currently integrated.

### PASS — temporal provenance
Records preserve `observedAt`, `reportedAt`, `knownAt`, source issue time where available, retrieval time, validity bounds, raw-payload reference, and raw-payload SHA-256. Validation rejects internally impossible `knownAt`/retrieval ordering and reversed validity windows.

### PASS — unknown semantics
Observation features are required tri-state fields. `null` means unknown/not established and remains distinct from `false`.

### PASS — anti-recursion
The contract contains no downstream model diagnosis, readiness score, return estimate, or fantasy outcome. TIBER-Forecast output cannot silently become TIBER-Data evidence through this contract.

### PASS — video/medical boundary
Video/game/practice observations capture visible/reported evidence only. The contract does not label those observations as confirmed anatomy or imaging.

### HOLD — live providers
Provider/source integration remains unimplemented and unapproved by this contract task. Any live news, medical-reporting, social, video, or external dataset feed requires a separate source audit, licensing/use-basis determination, raw trace design, and promotion decision.

### HOLD — source quality calibration
`sourceQuality` is contract-valid metadata, not a license to invent reliability weights. Production values require a governed calibration policy and must remain traceable to that policy.

## Conclusion

**Contract-safe to review. Production evidence availability remains intentionally unclaimed.**

The contract can support temporally correct downstream IRRIS development without fabricating data, diagnoses, or provider coverage. Promotion of live injury evidence remains a separate operator decision.
