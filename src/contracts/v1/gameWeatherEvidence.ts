import { z } from 'zod';

const nonEmptyStringSchema = z.string().trim().min(1);
const isoDatetimeSchema = z.string().datetime({ offset: true });
const finiteNumberSchema = z.number().finite();
const probabilitySchema = finiteNumberSchema.min(0).max(1);
const latitudeSchema = finiteNumberSchema.min(-90).max(90);
const longitudeSchema = finiteNumberSchema.min(-180).max(180);
const compassDegreesSchema = finiteNumberSchema.min(0).lt(360);
const fieldAxisDegreesSchema = finiteNumberSchema.min(0).lt(180);
const nonNegativeFiniteSchema = finiteNumberSchema.min(0);
const teamCodeSchema = z.string().regex(/^[A-Z]{2,4}$/);

export const GAME_WEATHER_EVIDENCE_CONTRACT_VERSION =
  'tiber-data.game-weather-evidence.v1.0.0';

export const gameWeatherEvidenceContractVersionSchema = z.literal(
  GAME_WEATHER_EVIDENCE_CONTRACT_VERSION,
);

export const gameWeatherArtifactStatusSchema = z.enum([
  'fixture_only',
  'source_backed_candidate',
  'promoted_source_backed',
]);

export const gameWeatherRoofTypeSchema = z.enum([
  'open_air',
  'fixed_dome',
  'retractable',
  'unknown',
]);

export const gameWeatherRoofStatusSchema = z.enum([
  'open',
  'closed',
  'partial',
  'unknown',
  'not_applicable',
]);

export const gameWeatherSourceRoleSchema = z.enum([
  'official_forecast',
  'probabilistic_blend',
  'rapid_refresh_model',
  'observation',
  'radar',
  'surface_analysis',
  'global_model',
  'roof_status',
  'alert',
  'other',
]);

export const gameWeatherEvidenceKindSchema = z.enum([
  'forecast',
  'observation',
  'analysis',
  'radar_estimate',
  'alert',
]);

export const gameWeatherPrecipitationTypeSchema = z.enum([
  'none',
  'rain',
  'snow',
  'sleet',
  'freezing_rain',
  'mixed',
  'unknown',
]);

export const gameWeatherGameSchema = z
  .object({
    game_id: nonEmptyStringSchema,
    season: z.number().int().min(1900).max(2100),
    week: z.number().int().min(1).max(25),
    kickoff_at: isoDatetimeSchema,
    home_team: teamCodeSchema,
    away_team: teamCodeSchema,
  })
  .strict();

export const gameWeatherVenueSchema = z
  .object({
    venue_id: nonEmptyStringSchema,
    stadium_name: nonEmptyStringSchema,
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    elevation_m: finiteNumberSchema.nullable(),
    timezone: nonEmptyStringSchema,
    field_axis_bearing_deg: fieldAxisDegreesSchema.nullable(),
    roof_type: gameWeatherRoofTypeSchema,
    surface_type: nonEmptyStringSchema.nullable(),
    source_name: nonEmptyStringSchema,
    source_record_id: nonEmptyStringSchema.nullable(),
    notes: z.array(nonEmptyStringSchema).default([]),
  })
  .strict();

export const gameWeatherFieldRelativeWindSchema = z
  .object({
    parallel_to_field_mps: nonNegativeFiniteSchema,
    cross_field_mps: nonNegativeFiniteSchema,
    field_axis_bearing_deg: fieldAxisDegreesSchema,
    derivation: z.literal('deterministic_vector_decomposition'),
  })
  .strict();

export const gameWeatherMeasurementsSchema = z
  .object({
    temperature_c: finiteNumberSchema.nullable(),
    apparent_temperature_c: finiteNumberSchema.nullable(),
    dew_point_c: finiteNumberSchema.nullable(),
    relative_humidity: probabilitySchema.nullable(),
    pressure_hpa: nonNegativeFiniteSchema.nullable(),
    visibility_m: nonNegativeFiniteSchema.nullable(),
    sustained_wind_mps: nonNegativeFiniteSchema.nullable(),
    wind_gust_mps: nonNegativeFiniteSchema.nullable(),
    wind_direction_deg: compassDegreesSchema.nullable(),
    precipitation_probability: probabilitySchema.nullable(),
    precipitation_rate_mm_per_hr: nonNegativeFiniteSchema.nullable(),
    precipitation_type: gameWeatherPrecipitationTypeSchema,
    lightning_probability: probabilitySchema.nullable(),
  })
  .strict()
  .superRefine((measurements, ctx) => {
    if (
      measurements.sustained_wind_mps !== null &&
      measurements.wind_gust_mps !== null &&
      measurements.wind_gust_mps < measurements.sustained_wind_mps
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wind_gust_mps'],
        message: 'wind_gust_mps must be greater than or equal to sustained_wind_mps.',
      });
    }

    if (
      measurements.precipitation_rate_mm_per_hr !== null &&
      measurements.precipitation_rate_mm_per_hr > 0 &&
      measurements.precipitation_type === 'none'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['precipitation_type'],
        message: 'precipitation_type cannot be none when precipitation_rate_mm_per_hr is positive.',
      });
    }
  });

export const gameWeatherSourceEvidenceSchema = z
  .object({
    evidence_id: nonEmptyStringSchema,
    provider: nonEmptyStringSchema,
    provider_product: nonEmptyStringSchema,
    source_role: gameWeatherSourceRoleSchema,
    evidence_kind: gameWeatherEvidenceKindSchema,
    source_record_id: nonEmptyStringSchema.nullable(),
    source_locator: nonEmptyStringSchema.nullable(),
    issued_at: isoDatetimeSchema.nullable(),
    valid_start: isoDatetimeSchema,
    valid_end: isoDatetimeSchema,
    retrieved_at: isoDatetimeSchema,
    known_at: isoDatetimeSchema,
    location_latitude: latitudeSchema,
    location_longitude: longitudeSchema,
    measurements: gameWeatherMeasurementsSchema,
    field_relative_wind: gameWeatherFieldRelativeWindSchema.nullable(),
    alert_codes: z.array(nonEmptyStringSchema).default([]),
    provider_confidence: probabilitySchema.nullable(),
    raw_trace_ref: nonEmptyStringSchema,
    notes: z.array(nonEmptyStringSchema).default([]),
  })
  .strict()
  .superRefine((evidence, ctx) => {
    const validStart = Date.parse(evidence.valid_start);
    const validEnd = Date.parse(evidence.valid_end);
    const retrievedAt = Date.parse(evidence.retrieved_at);
    const knownAt = Date.parse(evidence.known_at);

    if (validEnd < validStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valid_end'],
        message: 'valid_end must be greater than or equal to valid_start.',
      });
    }

    if (knownAt < retrievedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['known_at'],
        message: 'known_at must be greater than or equal to retrieved_at.',
      });
    }
  });

export const gameWeatherRoofEvidenceSchema = z
  .object({
    evidence_id: nonEmptyStringSchema,
    provider: nonEmptyStringSchema,
    status: gameWeatherRoofStatusSchema,
    effective_at: isoDatetimeSchema,
    retrieved_at: isoDatetimeSchema,
    known_at: isoDatetimeSchema,
    source_record_id: nonEmptyStringSchema.nullable(),
    source_locator: nonEmptyStringSchema.nullable(),
    raw_trace_ref: nonEmptyStringSchema,
    notes: z.array(nonEmptyStringSchema).default([]),
  })
  .strict()
  .superRefine((evidence, ctx) => {
    if (Date.parse(evidence.known_at) < Date.parse(evidence.retrieved_at)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['known_at'],
        message: 'known_at must be greater than or equal to retrieved_at.',
      });
    }
  });

export const gameWeatherEvidenceProvenanceSchema = z
  .object({
    contract_owner: z.literal('TIBER-Data'),
    emitted_by: nonEmptyStringSchema,
    validated_by: nonEmptyStringSchema,
    source_policy: nonEmptyStringSchema,
    notes: z.array(nonEmptyStringSchema).default([]),
  })
  .strict();

export const gameWeatherEvidenceBundleSchema = z
  .object({
    contract_version: gameWeatherEvidenceContractVersionSchema,
    artifact_status: gameWeatherArtifactStatusSchema,
    generated_at: isoDatetimeSchema,
    as_of: isoDatetimeSchema,
    game: gameWeatherGameSchema,
    venue: gameWeatherVenueSchema,
    weather_evidence: z.array(gameWeatherSourceEvidenceSchema),
    roof_evidence: z.array(gameWeatherRoofEvidenceSchema).default([]),
    warnings: z.array(nonEmptyStringSchema).default([]),
    provenance: gameWeatherEvidenceProvenanceSchema,
  })
  .strict()
  .superRefine((bundle, ctx) => {
    const asOf = Date.parse(bundle.as_of);
    const generatedAt = Date.parse(bundle.generated_at);

    if (generatedAt < asOf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['generated_at'],
        message: 'generated_at must be greater than or equal to as_of.',
      });
    }

    for (const [index, evidence] of bundle.weather_evidence.entries()) {
      if (Date.parse(evidence.known_at) > asOf) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['weather_evidence', index, 'known_at'],
          message: 'weather evidence known_at cannot be later than bundle as_of.',
        });
      }
    }

    for (const [index, evidence] of bundle.roof_evidence.entries()) {
      if (Date.parse(evidence.known_at) > asOf) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['roof_evidence', index, 'known_at'],
          message: 'roof evidence known_at cannot be later than bundle as_of.',
        });
      }
    }
  });

export function validateGameWeatherEvidenceBundle(input: unknown): GameWeatherEvidenceBundle {
  return gameWeatherEvidenceBundleSchema.parse(input);
}

export function isGameWeatherEvidenceBundle(input: unknown): input is GameWeatherEvidenceBundle {
  return gameWeatherEvidenceBundleSchema.safeParse(input).success;
}

export type GameWeatherArtifactStatus = z.infer<typeof gameWeatherArtifactStatusSchema>;
export type GameWeatherRoofType = z.infer<typeof gameWeatherRoofTypeSchema>;
export type GameWeatherRoofStatus = z.infer<typeof gameWeatherRoofStatusSchema>;
export type GameWeatherSourceRole = z.infer<typeof gameWeatherSourceRoleSchema>;
export type GameWeatherEvidenceKind = z.infer<typeof gameWeatherEvidenceKindSchema>;
export type GameWeatherPrecipitationType = z.infer<typeof gameWeatherPrecipitationTypeSchema>;
export type GameWeatherGame = z.infer<typeof gameWeatherGameSchema>;
export type GameWeatherVenue = z.infer<typeof gameWeatherVenueSchema>;
export type GameWeatherFieldRelativeWind = z.infer<typeof gameWeatherFieldRelativeWindSchema>;
export type GameWeatherMeasurements = z.infer<typeof gameWeatherMeasurementsSchema>;
export type GameWeatherSourceEvidence = z.infer<typeof gameWeatherSourceEvidenceSchema>;
export type GameWeatherRoofEvidence = z.infer<typeof gameWeatherRoofEvidenceSchema>;
export type GameWeatherEvidenceProvenance = z.infer<typeof gameWeatherEvidenceProvenanceSchema>;
export type GameWeatherEvidenceBundle = z.infer<typeof gameWeatherEvidenceBundleSchema>;
