import { describe, expect, it } from 'vitest';
import { injuryEvidenceRecordV0Schema } from '../src/contracts/v1/injuryEvidenceV0.js';

const unknownFeatures = {
  contact: null,
  nonContact: null,
  plantedFoot: null,
  externalRotation: null,
  inversion: null,
  eversion: null,
  hyperextension: null,
  sprinting: null,
  acceleration: null,
  deceleration: null,
  immediateStop: null,
  returnedToGame: null,
  unableToBearWeight: null,
  visibleLimp: null,
  carted: null,
  walkingBoot: null,
  crutches: null,
  brace: null,
  imagingNegativeFracture: null,
  structuralDamageReported: null,
  surgeryReported: null,
  practiceDnp: null,
  practiceLimited: null,
  practiceFull: null,
  firstTeamReps: null,
  cuttingObserved: null,
  sprintingObserved: null,
  workloadRestrictionReported: null,
  gameTimeDecision: null,
  expectedActive: null,
  expectedInactive: null,
  sameRegionRecurrence: null,
  concussionProtocol: null,
};

const validRecord = {
  contractVersion: 'injury-evidence-v0' as const,
  evidenceId: 'inj-2026-w2-001',
  playerId: '00-0000001',
  gameId: '2026-W02-DAL-NYG',
  claimType: 'practice_participation' as const,
  observedAt: '2026-09-10T17:00:00Z',
  reportedAt: '2026-09-10T17:01:00Z',
  knownAt: '2026-09-10T17:01:15Z',
  validFrom: '2026-09-10T17:00:00Z',
  validTo: null,
  bodyRegion: 'hamstring' as const,
  side: 'right' as const,
  rawText: 'Limited participant — hamstring',
  reportedDiagnosis: null,
  reportedSeverity: null,
  sourceQuality: 1,
  features: { ...unknownFeatures, practiceLimited: true },
  source: {
    sourceKind: 'official_injury_report' as const,
    sourceName: 'official club injury report',
    sourceRecordId: 'club-report-2026-w2-thu',
    sourceUrl: 'https://example.com/report',
    sourceIssuedAt: '2026-09-10T17:00:30Z',
    retrievedAt: '2026-09-10T17:02:00Z',
    rawPayloadRef: 'raw/injury/2026/w02/club-report.json',
    rawPayloadSha256: 'a'.repeat(64),
    licenseOrUseBasis: 'source-use basis recorded by operator',
  },
};

describe('injuryEvidenceRecordV0Schema', () => {
  it('accepts a provenance-complete source observation', () => {
    expect(injuryEvidenceRecordV0Schema.parse(validRecord).evidenceId).toBe(validRecord.evidenceId);
  });

  it('rejects known_at before reported_at', () => {
    const result = injuryEvidenceRecordV0Schema.safeParse({ ...validRecord, knownAt: '2026-09-10T16:59:00Z' });
    expect(result.success).toBe(false);
  });

  it('rejects known_at later than retrieval', () => {
    const result = injuryEvidenceRecordV0Schema.safeParse({ ...validRecord, knownAt: '2026-09-10T18:00:00Z' });
    expect(result.success).toBe(false);
  });

  it('requires an immutable raw-payload hash', () => {
    const result = injuryEvidenceRecordV0Schema.safeParse({
      ...validRecord,
      source: { ...validRecord.source, rawPayloadSha256: 'not-a-sha' },
    });
    expect(result.success).toBe(false);
  });

  it('preserves unknown observations as null rather than false defaults', () => {
    const parsed = injuryEvidenceRecordV0Schema.parse(validRecord);
    expect(parsed.features.unableToBearWeight).toBeNull();
    expect(parsed.features.practiceLimited).toBe(true);
  });
});
