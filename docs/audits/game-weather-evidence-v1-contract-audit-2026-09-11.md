# Game Weather Evidence v1 Contract Audit — 2026-09-11

## Audit trigger

This is a **contract task** under `AGENTS.md`, so an auditor-function review is required before merge.

Audited surfaces:

- `src/contracts/v1/gameWeatherEvidence.ts`
- `test/gameWeatherEvidence.v1.test.ts`
- `docs/contracts/game-weather-evidence-v1.md`

## Scope classification

Allowed current scope:

- schema/contract definition;
- deterministic fixture-only validation;
- provenance and temporal eligibility semantics;
- downstream handoff documentation.

Not authorized in this change:

- external weather ingestion or mirroring;
- live provider adapters;
- historical backfill;
- promotion of source-backed weather artifacts;
- fantasy-impact modeling;
- provider weighting/reconciliation;
- lineup recommendation logic.

## Findings

### PASS — point-in-time eligibility is explicit

Every weather and roof evidence row carries `retrieved_at` and `known_at`, and the bundle carries `as_of`.

The bundle rejects evidence where `known_at > as_of`. This prevents future-known weather evidence from entering historical replay snapshots.

### PASS — source disagreement is preservable

The contract stores source rows independently rather than collapsing multiple providers into one canonical scalar. Provider, product, role, validity window, source locator, raw trace reference, and normalized measurements travel with each evidence row.

This avoids silently hiding disagreement between official forecasts, rapid-refresh guidance, observations, radar, analyses, and other sources.

### PASS — missing evidence fails closed

`weather_evidence` may be empty. The contract therefore supports an explicit unavailable state rather than forcing a neutral/default weather row.

Downstream documentation explicitly forbids interpreting an empty evidence array as calm weather.

### PASS — roof status is not inferred from roof type

Static venue `roof_type` and timestamped `roof_evidence` are separate. A retractable venue does not imply open/closed game-time state.

### PASS — deterministic field geometry is separated from model impact

Optional field-relative wind is limited to deterministic vector decomposition (`parallel_to_field_mps`, `cross_field_mps`) using the venue field axis.

No fantasy scoring, player effect, recommendation, or market adjustment enters the TIBER-Data contract.

### PASS — units and bounded values are explicit

The schema bounds probabilities to `0..1`, directions to `[0,360)`, field axis to `[0,180)`, latitude/longitude to physical ranges, and non-negative rate/distance/wind values where appropriate.

It also rejects gust values below sustained wind when both exist, and positive precipitation rate paired with precipitation type `none`.

### PASS — fixtures do not masquerade as source truth

The test specimen uses synthetic provider names, venue IDs, source locators, and notes declaring fixture-only status. It does not claim NWS/NOAA/ECMWF/NFL/stadium coverage.

### PASS — contract does not self-authorize external sources

The documentation names intended future source families only as candidates requiring separately authorized source audits. No ingestion, download, license, redistribution, or coverage claim is made here.

## Bounded risks / follow-ups

1. **Venue metadata temporalization:** v1 carries venue provenance but not a separate venue `known_at`/validity interval. Before historical production use, the venue registry should version surface/roof/geometry changes by effective period so replay does not accidentally use later venue metadata.
2. **Raw trace retention policy:** `raw_trace_ref` is mandatory, but retention/storage rules are not defined here. Each future provider lane must define an immutable or content-addressed raw trace policy.
3. **Provider-native precision:** future adapters must preserve provider-native issue/validity precision and timezone/offset before normalization. The contract can carry normalized timestamps but does not by itself guarantee raw precision retention.
4. **Field-relative wind validation:** the contract validates shape, not the trigonometric correctness of supplied derived components. The future deterministic builder must recompute and test this derivation from raw wind direction/speed plus field axis.
5. **Roof source authority:** no source hierarchy for roof decisions is defined here. A later source audit must identify first-hand/official evidence and conflict handling.

None of these risks requires inventing data or widening the current contract claim. They are deliberately deferred to separately authorized implementation/source work.

## Audit verdict

**PASS FOR CONTRACT FOUNDATION / NOT AUTHORIZED FOR LIVE INGESTION OR PROMOTION.**

The change is consistent with TIBER-Data's fail-closed doctrine and repo boundary as long as merge notes preserve the explicit non-claims above.
