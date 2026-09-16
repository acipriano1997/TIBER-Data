import { z } from 'zod';

const isoDatetimeSchema = z.string().datetime({ offset: true });

const uniqueNonEmptyArray = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.array(itemSchema).min(1).refine((items) => new Set(items).size === items.length, {
    message: 'array items must be unique',
  });

export const seasonIntelligenceFactStatusSchema = z.enum([
  'CONFIRMED',
  'REPORTED',
  'OBSERVED',
  'SPECULATIVE',
]);

export const seasonIntelligenceModelTreatmentSchema = z.enum([
  'IMMEDIATE_UPDATE',
  'PARTIAL_UPDATE',
  'WATCH_ONLY',
  'CONTEXT_ONLY',
  'NO_MODEL_WEIGHT',
]);

const seasonIntelligenceMechanismSchema = z.enum([
  'snap_share',
  'route_share',
  'target_share',
  'carry_share',
  'goal_line_role',
  'personnel',
  'qb_change',
  'injury_recurring',
  'protection',
  'coaching',
  'availability',
  'volume',
  'turnover_context',
  'replacement_competence',
  'defensive_matchup',
  'other',
]);

export const seasonIntelligenceEventSchema = z.object({
  event_id: z.string().regex(/^sie-\d{4}-w\d{2}-[a-z0-9-]+$/),
  schema_version: z.literal('season-intelligence-event.v1'),
  season: z.number().int().min(1900),
  week: z.number().int().min(1).max(22),
  occurred_at: isoDatetimeSchema.nullable().optional(),
  known_at: isoDatetimeSchema,
  subject: z.object({
    entity_type: z.enum(['player', 'team', 'position_group', 'coach', 'game', 'league']),
    display_name: z.string().min(1),
    team: z.string().min(2).nullable(),
    canonical_id: z.string().nullable().optional(),
  }).strict(),
  event_type: z.enum([
    'injury',
    'readiness',
    'role',
    'usage',
    'depth_chart',
    'scheme',
    'performance_context',
    'transaction',
    'contract',
    'discipline',
    'team_context',
  ]),
  fact_status: seasonIntelligenceFactStatusSchema,
  summary: z.string().min(1),
  mechanisms: uniqueNonEmptyArray(seasonIntelligenceMechanismSchema),
  sources: z.array(z.object({
    source_name: z.string().min(1),
    source_role: z.enum([
      'league',
      'team',
      'wire',
      'primary_media',
      'specialist_analysis',
      'community_analysis',
    ]),
    url: z.string().url(),
    published_at: isoDatetimeSchema.nullable(),
    retrieved_at: isoDatetimeSchema,
    quality: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  }).strict()).min(1),
  confidence: z.number().min(0).max(1),
  fantasy_impact: z.object({
    direction: z.enum(['UP', 'DOWN', 'MIXED', 'NEUTRAL']),
    magnitude: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    time_horizon: z.enum(['WEEK_2', 'SHORT_TERM', 'REST_OF_SEASON', 'MULTI_YEAR', 'UNKNOWN']),
    uncertainty: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    role_fragility: z.enum(['LOW', 'MEDIUM', 'HIGH', 'NOT_APPLICABLE']),
    affected_entities: z.array(z.string().min(1)),
  }).strict(),
  model_treatment: seasonIntelligenceModelTreatmentSchema,
  next_required_evidence: z.array(z.string().min(1)),
  recheck_after: isoDatetimeSchema.nullable(),
  supersedes_event_id: z.string().nullable().optional(),
  notes: z.array(z.string().min(1)).optional(),
}).strict();

export const seasonIntelligenceSnapshotSchema = z.object({
  snapshot_id: z.string().regex(/^sis-\d{4}-w\d{2}-[a-z0-9-]+$/),
  schema_version: z.literal('season-intelligence-snapshot.v1'),
  season: z.number().int().min(1900),
  week: z.number().int().min(1).max(22),
  status: z.literal('FROZEN'),
  frozen_at: isoDatetimeSchema,
  evidence_cutoff: isoDatetimeSchema,
  scope: z.string().min(1),
  themes: z.array(z.object({
    theme_id: z.string().min(1),
    summary: z.string().min(1),
  }).strict()).min(1),
  fingerprint_algorithm: z.literal('sha256-canonical-json'),
  fingerprint_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  event_files: uniqueNonEmptyArray(z.string().regex(/^events-\d{2}\.json$/)),
  event_count: z.number().int().min(1),
}).strict();

export const seasonIntelligenceDeltaSchema = z.object({
  delta_id: z.string().regex(/^sid-\d{4}-w\d{2}-[a-z0-9-]+$/),
  schema_version: z.literal('season-intelligence-delta.v1'),
  parent_snapshot_id: z.string().min(1),
  as_of: isoDatetimeSchema,
  events: z.array(seasonIntelligenceEventSchema).min(1),
}).strict();

export type SeasonIntelligenceEvent = z.infer<typeof seasonIntelligenceEventSchema>;
export type SeasonIntelligenceSnapshot = z.infer<typeof seasonIntelligenceSnapshotSchema>;
export type SeasonIntelligenceDelta = z.infer<typeof seasonIntelligenceDeltaSchema>;
