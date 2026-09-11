import { z } from 'zod';

const isoDatetimeSchema = z.string().datetime({ offset: true });
const nullableBoolean = z.boolean().nullable();

export const injuryEvidenceSourceKindSchema = z.enum([
  'official_injury_report',
  'official_transaction',
  'team_statement',
  'coach_statement',
  'player_statement',
  'medical_reporting',
  'national_reporter',
  'beat_reporter',
  'practice_observation',
  'video_observation',
  'game_observation',
  'workload_data',
  'travel_data',
  'weather_data',
  'other',
]);

export const injuryEvidenceClaimTypeSchema = z.enum([
  'body_region',
  'diagnosis_reported',
  'severity_reported',
  'availability',
  'practice_participation',
  'mechanism',
  'functional_observation',
  'diagnostic_test',
  'treatment_device',
  'workload',
  'travel_recovery',
  'environmental_recovery',
  'narrative',
  'other',
]);

export const injuryBodyRegionSchema = z.enum([
  'head',
  'neck',
  'shoulder',
  'arm',
  'elbow',
  'wrist_hand',
  'back',
  'hip',
  'groin_adductor',
  'quadriceps',
  'hamstring',
  'knee',
  'calf',
  'achilles',
  'ankle',
  'foot_toe',
  'illness',
  'other',
  'unknown',
]);

export const injuryEvidenceFeaturesSchema = z.object({
  contact: nullableBoolean,
  nonContact: nullableBoolean,
  plantedFoot: nullableBoolean,
  externalRotation: nullableBoolean,
  inversion: nullableBoolean,
  eversion: nullableBoolean,
  hyperextension: nullableBoolean,
  sprinting: nullableBoolean,
  acceleration: nullableBoolean,
  deceleration: nullableBoolean,
  immediateStop: nullableBoolean,
  returnedToGame: nullableBoolean,
  unableToBearWeight: nullableBoolean,
  visibleLimp: nullableBoolean,
  carted: nullableBoolean,
  walkingBoot: nullableBoolean,
  crutches: nullableBoolean,
  brace: nullableBoolean,
  imagingNegativeFracture: nullableBoolean,
  structuralDamageReported: nullableBoolean,
  surgeryReported: nullableBoolean,
  practiceDnp: nullableBoolean,
  practiceLimited: nullableBoolean,
  practiceFull: nullableBoolean,
  firstTeamReps: nullableBoolean,
  cuttingObserved: nullableBoolean,
  sprintingObserved: nullableBoolean,
  workloadRestrictionReported: nullableBoolean,
  gameTimeDecision: nullableBoolean,
  expectedActive: nullableBoolean,
  expectedInactive: nullableBoolean,
  sameRegionRecurrence: nullableBoolean,
  concussionProtocol: nullableBoolean,
});

export const injuryEvidenceSourceEnvelopeV0Schema = z.object({
  sourceKind: injuryEvidenceSourceKindSchema,
  sourceName: z.string().min(1),
  sourceRecordId: z.string().min(1),
  sourceUrl: z.string().url().nullable(),
  sourceIssuedAt: isoDatetimeSchema.nullable(),
  retrievedAt: isoDatetimeSchema,
  rawPayloadRef: z.string().min(1),
  rawPayloadSha256: z.string().regex(/^[a-f0-9]{64}$/),
  licenseOrUseBasis: z.string().min(1).nullable(),
});

export const injuryEvidenceRecordV0Schema = z.object({
  contractVersion: z.literal('injury-evidence-v0'),
  evidenceId: z.string().min(1),
  playerId: z.string().min(1),
  gameId: z.string().min(1).nullable(),
  claimType: injuryEvidenceClaimTypeSchema,
  observedAt: isoDatetimeSchema,
  reportedAt: isoDatetimeSchema,
  knownAt: isoDatetimeSchema,
  validFrom: isoDatetimeSchema.nullable(),
  validTo: isoDatetimeSchema.nullable(),
  bodyRegion: injuryBodyRegionSchema.nullable(),
  side: z.enum(['left', 'right', 'bilateral', 'unknown']).nullable(),
  rawText: z.string().min(1).nullable(),
  reportedDiagnosis: z.string().min(1).nullable(),
  reportedSeverity: z.string().min(1).nullable(),
  sourceQuality: z.number().min(0).max(1),
  features: injuryEvidenceFeaturesSchema,
  source: injuryEvidenceSourceEnvelopeV0Schema,
}).superRefine((record, ctx) => {
  const observed = Date.parse(record.observedAt);
  const reported = Date.parse(record.reportedAt);
  const known = Date.parse(record.knownAt);
  const retrieved = Date.parse(record.source.retrievedAt);

  if (known < reported) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['knownAt'], message: 'knownAt cannot precede reportedAt' });
  }
  if (known > retrieved) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['knownAt'], message: 'knownAt cannot be later than retrievedAt' });
  }
  if (reported < observed && record.claimType !== 'narrative') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['reportedAt'], message: 'reportedAt cannot precede observedAt for non-narrative evidence' });
  }
  if (record.validFrom && record.validTo && Date.parse(record.validTo) < Date.parse(record.validFrom)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['validTo'], message: 'validTo cannot precede validFrom' });
  }
});

export const injuryEvidenceArrayV0Schema = z.array(injuryEvidenceRecordV0Schema);

export type InjuryEvidenceSourceKindV0 = z.infer<typeof injuryEvidenceSourceKindSchema>;
export type InjuryEvidenceClaimTypeV0 = z.infer<typeof injuryEvidenceClaimTypeSchema>;
export type InjuryBodyRegionV0 = z.infer<typeof injuryBodyRegionSchema>;
export type InjuryEvidenceFeaturesV0 = z.infer<typeof injuryEvidenceFeaturesSchema>;
export type InjuryEvidenceSourceEnvelopeV0 = z.infer<typeof injuryEvidenceSourceEnvelopeV0Schema>;
export type InjuryEvidenceRecordV0 = z.infer<typeof injuryEvidenceRecordV0Schema>;
