# Game Weather Evidence v1

## Status

Canonical contract foundation only. This document does **not** claim live weather ingestion, historical weather coverage, provider licensing approval, or promoted source-backed weather artifacts.

Contract version: `tiber-data.game-weather-evidence.v1.0.0`

Implementation: `src/contracts/v1/gameWeatherEvidence.ts`

## Purpose

`GameWeatherEvidenceBundle` is the canonical TIBER-Data handoff shape for point-in-time NFL game weather evidence. It gives downstream repositories a strict way to carry weather facts, provider provenance, timing, venue context, and roof evidence without inventing provider-specific schemas or collapsing conflicting forecasts into a false single truth.

The contract owns **evidence semantics**, not fantasy-football impact modeling.

## Boundary

TIBER-Data may own:

- normalized source evidence and provenance;
- exact stadium coordinates and field-axis metadata once separately source-backed;
- source issue/retrieval/known/valid timestamps;
- deterministic unit normalization;
- deterministic wind-vector decomposition relative to the field axis;
- roof-state evidence and its provenance;
- explicit unavailable/unknown states;
- downstream handoff artifacts after source governance is complete.

TIBER-Data does not own:

- fantasy-point adjustments;
- player/archetype weather sensitivity;
- recommendation flips;
- Weather Impact Delta;
- multi-provider forecast weighting or learned reconciliation when it becomes model inference;
- Vegas/market residualization;
- lineup decisions.

Those belong in downstream forecasting/modeling and product-orchestration layers.

## Point-in-time requirement

Every bundle has an `as_of` timestamp. Every weather and roof evidence row has `retrieved_at` and `known_at` timestamps.

The schema rejects any evidence where:

```text
known_at > bundle.as_of
```

This is a hard anti-leakage rule. Historical recommendation replay must only use weather evidence that was actually eligible at the decision timestamp.

`generated_at` may be later than `as_of` so a historical replay artifact can be regenerated later while still containing only eligible point-in-time evidence.

## Artifact status

Allowed values:

- `fixture_only` — deterministic contract/test data; never a live-source claim.
- `source_backed_candidate` — source-backed but not promoted/governed for downstream production use.
- `promoted_source_backed` — explicitly reviewed/promoted source-backed evidence.

Location alone does not confer promotion. Provenance and review status remain authoritative.

## Game and venue identity

The bundle identifies:

- game ID;
- season/week;
- kickoff time;
- home/away teams;
- venue ID/name;
- exact coordinates;
- elevation when known;
- IANA timezone;
- field-axis bearing when known;
- roof type;
- surface type when known;
- venue metadata provenance.

`field_axis_bearing_deg` uses an undirected `0 <= bearing < 180` field axis, not a possession-specific head/tail direction. This avoids implying a single offense direction for an entire game.

## Source evidence rows

The contract intentionally preserves **multiple provider rows**. A downstream consumer may see official forecast, probabilistic blend, rapid-refresh model, observation, radar, surface analysis, global-model, alert, or other evidence simultaneously.

Each row includes:

- stable evidence ID;
- provider and product;
- source role and evidence kind;
- provider/source record locator when available;
- issue time when the product exposes one;
- valid start/end;
- retrieval time;
- known-at time;
- evidence-point coordinates;
- normalized measurements;
- optional deterministic field-relative wind decomposition;
- alert codes;
- optional provider-declared confidence;
- raw trace reference;
- notes.

The contract does not declare any provider permanently authoritative. Source weighting is a downstream policy/model concern.

## Normalized weather measurements

All normalized units are explicit:

- temperature/apparent temperature/dew point: Celsius;
- pressure: hPa;
- visibility: meters;
- sustained wind/gusts: meters per second;
- direction: meteorological degrees `[0, 360)`;
- precipitation probability: `0..1`;
- precipitation rate: millimeters/hour;
- lightning probability: `0..1`.

Precipitation type is one of:

`none | rain | snow | sleet | freezing_rain | mixed | unknown`

Missing values are `null`; consumers must not invent defaults.

## Wind semantics

Sustained wind and gusts are separate. When both are present, the schema requires:

```text
gust >= sustained
```

Optional field-relative wind is a deterministic geometric derivative:

- `parallel_to_field_mps`
- `cross_field_mps`
- `field_axis_bearing_deg`
- `derivation = deterministic_vector_decomposition`

These are magnitudes relative to the undirected field axis. They are not a fantasy-impact score.

## Roof evidence

Static venue `roof_type` does not establish game-time roof state.

Roof state is carried separately as timestamped evidence with its own provider, effective time, retrieval/known times, source locator, raw trace, and notes.

Allowed states:

`open | closed | partial | unknown | not_applicable`

Downstream consumers must not infer `closed` merely because a venue is a fixed dome or `open` merely because a retractable venue usually plays outdoors. If a decision needs game-time roof state and no eligible evidence exists, the state remains unknown/unavailable.

## Fail-closed behavior

`weather_evidence` may be empty. This represents an explicit no-eligible-evidence state and must be accompanied by a warning or equivalent downstream availability state.

A consumer must never interpret an empty evidence array as calm/neutral weather.

## Current fixture posture

The acceptance tests use synthetic fixture provider names, venue IDs, coordinates, source locators, and measurements. Those rows exist only to prove schema behavior.

No current fixture asserts NWS, NOAA, ECMWF, NFL, stadium, or commercial-provider coverage.

## Future source lanes requiring separate authorization

The intended candidate hierarchy includes source families such as:

- official NWS forecast/alert products;
- NOAA blended/probabilistic guidance;
- NOAA rapid-refresh model guidance;
- METAR/TAF observations/terminal forecasts;
- MRMS radar/multisensor precipitation products;
- RTMA/URMA surface analyses;
- ECMWF open forecast products;
- separately evaluated commercial/hyperlocal challengers;
- official/first-hand roof-status evidence.

Each source family requires a separate audit/authorization before ingestion or governed mirroring. This contract does not grant that authorization.

## Downstream recommendation architecture

A future weather-impact model should consume this evidence through a separate promoted/model boundary and produce its own versioned output. TIBER-Fantasy should consume the modeled impact and expose counterfactual decision materiality rather than recomputing weather-performance effects locally.
