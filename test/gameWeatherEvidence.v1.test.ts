import { describe, expect, it } from 'vitest';

import {
  GAME_WEATHER_EVIDENCE_CONTRACT_VERSION,
  gameWeatherEvidenceBundleSchema,
  isGameWeatherEvidenceBundle,
  validateGameWeatherEvidenceBundle,
} from '../src/contracts/v1/gameWeatherEvidence.js';

function buildFixture() {
  return {
    contract_version: GAME_WEATHER_EVIDENCE_CONTRACT_VERSION,
    artifact_status: 'fixture_only' as const,
    generated_at: '2026-09-11T12:05:00Z',
    as_of: '2026-09-11T12:00:00Z',
    game: {
      game_id: 'fixture-game-001',
      season: 2026,
      week: 1,
      kickoff_at: '2026-09-13T17:00:00Z',
      home_team: 'AAA',
      away_team: 'BBB',
    },
    venue: {
      venue_id: 'fixture-venue-001',
      stadium_name: 'Fixture Stadium',
      latitude: 40,
      longitude: -74,
      elevation_m: 10,
      timezone: 'America/New_York',
      field_axis_bearing_deg: 20,
      roof_type: 'retractable' as const,
      surface_type: 'fixture_surface',
      source_name: 'fixture_registry',
      source_record_id: 'fixture-venue-001',
      notes: ['Synthetic deterministic contract fixture; not a real venue claim.'],
    },
    weather_evidence: [
      {
        evidence_id: 'fixture-weather-001',
        provider: 'fixture_provider',
        provider_product: 'fixture_hourly_forecast',
        source_role: 'official_forecast' as const,
        evidence_kind: 'forecast' as const,
        source_record_id: 'fixture-record-001',
        source_locator: 'fixture://weather/001',
        issued_at: '2026-09-11T11:00:00Z',
        valid_start: '2026-09-13T17:00:00Z',
        valid_end: '2026-09-13T18:00:00Z',
        retrieved_at: '2026-09-11T11:59:00Z',
        known_at: '2026-09-11T12:00:00Z',
        location_latitude: 40,
        location_longitude: -74,
        measurements: {
          temperature_c: 12,
          apparent_temperature_c: 10,
          dew_point_c: 7,
          relative_humidity: 0.71,
          pressure_hpa: 1012,
          visibility_m: 16000,
          sustained_wind_mps: 8,
          wind_gust_mps: 13,
          wind_direction_deg: 285,
          precipitation_probability: 0.65,
          precipitation_rate_mm_per_hr: 1.5,
          precipitation_type: 'rain' as const,
          lightning_probability: 0.05,
        },
        field_relative_wind: {
          parallel_to_field_mps: 5,
          cross_field_mps: 6.25,
          field_axis_bearing_deg: 20,
          derivation: 'deterministic_vector_decomposition' as const,
        },
        alert_codes: [],
        provider_confidence: null,
        raw_trace_ref: 'fixture://raw/weather/001',
        notes: [],
      },
    ],
    roof_evidence: [
      {
        evidence_id: 'fixture-roof-001',
        provider: 'fixture_operator_notice',
        status: 'unknown' as const,
        effective_at: '2026-09-13T15:30:00Z',
        retrieved_at: '2026-09-11T11:58:00Z',
        known_at: '2026-09-11T11:59:00Z',
        source_record_id: null,
        source_locator: 'fixture://roof/001',
        raw_trace_ref: 'fixture://raw/roof/001',
        notes: ['Synthetic placeholder preserving unknown roof state.'],
      },
    ],
    warnings: ['Fixture-only contract specimen; no live weather coverage is asserted.'],
    provenance: {
      contract_owner: 'TIBER-Data' as const,
      emitted_by: 'test_fixture',
      validated_by: 'gameWeatherEvidenceBundleSchema',
      source_policy: 'fixture_only_no_external_source_claim',
      notes: [],
    },
  };
}

describe('game weather evidence v1 contract', () => {
  it('accepts a deterministic fixture-only point-in-time bundle', () => {
    const fixture = buildFixture();
    const parsed = validateGameWeatherEvidenceBundle(fixture);

    expect(parsed.contract_version).toBe(GAME_WEATHER_EVIDENCE_CONTRACT_VERSION);
    expect(parsed.artifact_status).toBe('fixture_only');
    expect(parsed.weather_evidence).toHaveLength(1);
    expect(isGameWeatherEvidenceBundle(parsed)).toBe(true);
  });

  it('rejects evidence that was not yet known at the bundle as_of time', () => {
    const fixture = buildFixture();
    fixture.weather_evidence[0].known_at = '2026-09-11T12:01:00Z';

    const result = gameWeatherEvidenceBundleSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it('rejects gust speed below sustained wind speed', () => {
    const fixture = buildFixture();
    fixture.weather_evidence[0].measurements.wind_gust_mps = 7;

    const result = gameWeatherEvidenceBundleSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it('rejects positive precipitation rate paired with precipitation_type none', () => {
    const fixture = buildFixture();
    fixture.weather_evidence[0].measurements.precipitation_type = 'none';

    const result = gameWeatherEvidenceBundleSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it('permits an empty weather evidence array to represent explicit unavailability', () => {
    const fixture = buildFixture();
    fixture.weather_evidence = [];
    fixture.warnings = ['No eligible weather evidence was available as of this snapshot.'];

    expect(gameWeatherEvidenceBundleSchema.safeParse(fixture).success).toBe(true);
  });
});
