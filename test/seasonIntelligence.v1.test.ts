import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  seasonIntelligenceDeltaSchema,
  seasonIntelligenceEventSchema,
  seasonIntelligenceSnapshotSchema,
} from '../src/index.js';

const PACK = resolve('data/season_intelligence/2026/week_01');

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }

  return value;
}

function fingerprint(manifest: any, events: any[]): string {
  const payload = canonicalize({
    season: manifest.season,
    week: manifest.week,
    evidence_cutoff: manifest.evidence_cutoff,
    themes: manifest.themes,
    events,
  });
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function loadPack() {
  const manifest = readJson(resolve(PACK, 'frozen-snapshot.json'));
  const events = manifest.event_files.flatMap((file: string) => readJson(resolve(PACK, file)));
  const delta = readJson(resolve(PACK, 'deltas/2026-09-15.json'));
  return { manifest, events, delta };
}

describe('Season Intelligence v1', () => {
  it('parses the frozen Week 1 pack through the native Zod surface', () => {
    const { manifest, events, delta } = loadPack();

    expect(seasonIntelligenceSnapshotSchema.safeParse(manifest).success).toBe(true);
    for (const event of events) {
      expect(seasonIntelligenceEventSchema.safeParse(event).success).toBe(true);
    }
    expect(seasonIntelligenceDeltaSchema.safeParse(delta).success).toBe(true);

    expect(events).toHaveLength(manifest.event_count);
    expect(new Set(events.map((event: any) => event.event_id)).size).toBe(events.length);
  });

  it('preserves freeze timing, append-only deltas, supersession, and fingerprint integrity', () => {
    const { manifest, events, delta } = loadPack();
    const frozenAt = Date.parse(manifest.frozen_at);

    expect(events.every((event: any) => Date.parse(event.known_at) <= frozenAt)).toBe(true);
    expect(delta.events.every((event: any) => Date.parse(event.known_at) > frozenAt)).toBe(true);
    expect(delta.parent_snapshot_id).toBe(manifest.snapshot_id);

    const frozenEventIds = new Set(events.map((event: any) => event.event_id));
    for (const event of delta.events) {
      if (event.supersedes_event_id !== null && event.supersedes_event_id !== undefined) {
        expect(frozenEventIds.has(event.supersedes_event_id)).toBe(true);
      }
    }

    expect(fingerprint(manifest, events)).toBe(manifest.fingerprint_sha256);
  });

  it('matches JSON-Schema optional-field semantics and rejects nested unknown properties', () => {
    const { events } = loadPack();
    const event = structuredClone(events[0]);

    delete event.occurred_at;
    delete event.subject.canonical_id;
    delete event.supersedes_event_id;
    delete event.notes;
    expect(seasonIntelligenceEventSchema.safeParse(event).success).toBe(true);

    const invalid = structuredClone(event);
    invalid.subject.unexpected = true;
    expect(seasonIntelligenceEventSchema.safeParse(invalid).success).toBe(false);
  });

  it('enforces JSON-Schema uniqueness rules for mechanisms and event shard names', () => {
    const { manifest, events } = loadPack();
    const event = structuredClone(events[0]);
    event.mechanisms = [event.mechanisms[0], event.mechanisms[0]];
    expect(seasonIntelligenceEventSchema.safeParse(event).success).toBe(false);

    const duplicateFiles = {
      ...manifest,
      event_files: [manifest.event_files[0], manifest.event_files[0]],
    };
    expect(seasonIntelligenceSnapshotSchema.safeParse(duplicateFiles).success).toBe(false);
  });

  it('keeps fact status, evidence confidence, and model treatment separate without pseudo-probabilities', () => {
    const { events, delta } = loadPack();
    const allEvents = [...events, ...delta.events];
    const statuses = new Set(events.map((event: any) => event.fact_status));
    const treatments = new Set(events.map((event: any) => event.model_treatment));

    for (const expected of ['CONFIRMED', 'REPORTED', 'OBSERVED']) {
      expect(statuses.has(expected)).toBe(true);
    }
    for (const expected of ['IMMEDIATE_UPDATE', 'PARTIAL_UPDATE', 'WATCH_ONLY', 'CONTEXT_ONLY']) {
      expect(treatments.has(expected)).toBe(true);
    }
    for (const event of allEvents) {
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(event.confidence_tier);
      expect(event).not.toHaveProperty('confidence');
      expect(event.fantasy_impact.time_horizon).not.toBe('WEEK_2');
    }
  });
});
