# Weather Intelligence Follow-on Queue

Status: future work queue. Items here are **not activated** merely by being listed.

This queue preserves the remaining work for the Fantasy Football Command Center weather system after the canonical `game-weather-evidence-v1` contract foundation.

## Ownership split

- **TIBER-Data:** source audits, canonical venue/weather/roof evidence contracts, raw-trace provenance, source-backed normalized handoffs.
- **Forecasting/modeling lane:** provider reconciliation, forecast-error calibration, weather-to-football effect modeling, uncertainty, counterfactuals, market residualization.
- **TIBER-Fantasy:** downstream adapters/orchestration, availability/freshness presentation, lineup/start-sit consumption, user-facing Weather Card. No local reinvention of upstream models.

## Future source-audit gates

Each source family gets a separate audit before ingestion/mirroring:

1. NWS API — point/grid/hourly forecasts and alerts.
2. NOAA National Blend of Models — blended/probabilistic forecast guidance.
3. NOAA rapid-refresh guidance — HRRR and operational successor/current RRFS products.
4. Aviation Weather Center — METAR observations and TAF forecasts.
5. NOAA MRMS — radar/multisensor precipitation and storm truth.
6. NOAA RTMA/URMA — real-time surface analysis and delayed verification truth.
7. ECMWF open real-time IFS/AIFS products — independent global-model challenger.
8. Optional commercial challengers (for example WeatherKit/Tomorrow.io) — licensing, attribution, cost, retention, redistribution, and measured incremental value must all be resolved first.
9. Roof-status evidence — identify first-hand official sources, timing rules, conflicts, and immutable trace policy.

No source is granted permanent supremacy by this queue.

## TIBER-Data implementation queue

- Build a versioned NFL venue registry with exact coordinates, IANA timezone, elevation where source-backed, field-axis bearing, roof type, surface, effective periods, and provenance.
- Add provider-specific source adapters only after their audits pass.
- Preserve raw provider payload/record references and provider-native timestamps/offsets before normalization.
- Implement deterministic unit normalization.
- Implement and test field-relative wind vector decomposition.
- Add source-health/freshness checks and explicit missing/stale states.
- Build point-in-time game-window weather evidence snapshots.
- Build source-backed roof-state evidence snapshots.
- Add historical forecast archive support only when legal/source/reproducibility constraints are satisfied.
- Create verification joins to observations/analysis truth for provider scoring without contaminating historical decision replay.

## Forecasting/modeling implementation queue

- Provider accuracy scorecards by lead time, variable, venue/region, and season.
- Multi-source reconciliation preserving disagreement and uncertainty.
- Game-window aggregation rather than kickoff-only weather.
- Antecedent precipitation / field-wetness proxy research.
- Historical weather-performance research with team/opponent/venue/era/game-script controls and partial pooling.
- Position/archetype interactions for QB/RB/WR/TE; kicker/DST only if/when downstream product position scope explicitly expands.
- Nonlinear wind/gust/crosswind response curves learned from data rather than folklore thresholds.
- Weather Impact Delta (median/floor/ceiling/bust/ceiling-probability effects) with uncertainty.
- Neutral-weather counterfactual for every recommendation.
- Market/Vegas absorption guard so weather already priced into totals/spreads is not double-counted.
- Abstention rule when weather effect is smaller than model/forecast uncertainty.
- Challenger-model framework and out-of-sample calibration gates.

## TIBER-Fantasy implementation queue

- Add a dedicated read-only weather external-model/evidence adapter; fail closed when unconfigured, stale, malformed, or unavailable.
- Keep legacy `server/modules/startSit/` frozen/extract-only; integrate weather through the replacement/external recommendation boundary rather than adding net-new scoring logic there.
- Add per-game Weather Card with roof state, game-window timeline, sustained wind/gust/crosswind, precipitation timing/intensity, temperature, alerts, freshness, source agreement/confidence, and explicit availability state.
- Show weather-adjusted vs neutral-weather counterfactual only when the upstream model supplies it.
- Surface `weather changed this recommendation` only when counterfactual comparison proves a flip.
- Support late-swap refresh for unlocked games.
- Add degraded-data messaging instead of neutral defaults.

## Refresh/cadence research target

Candidate policy to validate against source cadence/cost/terms:

- multi-day: lower-frequency refresh;
- inside 48 hours: at least hourly where source products update;
- game day: increasing frequency;
- final 3 hours: observations/radar/alerts/roof evidence dominate, with roughly 5–15 minute refresh where source cadence and terms permit;
- preserve every accepted snapshot needed for exact as-of replay.

## Certification queue

- immutable decision/evidence replay;
- frozen-as-of eligibility checks;
- source/fact-family coverage checks;
- duplicate-ingestion idempotency;
- correction/supersession lineage;
- provider-clock/timestamp precision handling;
- stale/invalid roof fact blockers when decision-material;
- missing-source fallback/abstention tests;
- point-in-time backtests using forecasts available at the historical decision time, never hindsight weather;
- provider forecast scoring against later observation/analysis truth kept separate from recommendation replay.

## Activation rule

Before any queue item becomes implementation work, identify the owning repo, exact source truth, licensing/access posture, contract/version boundary, validation plan, and promotion authority. If those are missing, reduce scope rather than filling gaps with plausible defaults.
