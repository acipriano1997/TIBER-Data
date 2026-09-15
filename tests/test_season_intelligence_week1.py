from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "contracts"
PACK = ROOT / "data" / "season_intelligence" / "2026" / "week_01"


def _load(path: Path):
    return json.loads(path.read_text())


def _canonical_fingerprint(manifest: dict, events: list[dict]) -> str:
    payload = {
        "season": manifest["season"],
        "week": manifest["week"],
        "evidence_cutoff": manifest["evidence_cutoff"],
        "themes": manifest["themes"],
        "events": events,
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


def test_week1_season_intelligence_pack_contract_and_freeze_semantics():
    event_schema = _load(CONTRACTS / "season-intelligence-event.v1.schema.json")
    snapshot_schema = _load(CONTRACTS / "season-intelligence-snapshot.v1.schema.json")
    delta_schema = _load(CONTRACTS / "season-intelligence-delta.v1.schema.json")
    manifest = _load(PACK / "frozen-snapshot.json")
    delta = _load(PACK / "deltas" / "2026-09-15.json")
    checker = FormatChecker()

    for schema in (event_schema, snapshot_schema, delta_schema):
        Draft202012Validator.check_schema(schema)

    Draft202012Validator(snapshot_schema, format_checker=checker).validate(manifest)

    events: list[dict] = []
    for shard_name in manifest["event_files"]:
        shard = _load(PACK / shard_name)
        assert isinstance(shard, list) and shard
        for event in shard:
            Draft202012Validator(event_schema, format_checker=checker).validate(event)
        events.extend(shard)

    # Validate the delta wrapper without resolving its event ref; each event is
    # validated directly against the canonical event contract below.
    delta_wrapper_schema = deepcopy(delta_schema)
    delta_wrapper_schema["properties"]["events"] = {"type": "array", "minItems": 1}
    Draft202012Validator(delta_wrapper_schema, format_checker=checker).validate(delta)
    for event in delta["events"]:
        Draft202012Validator(event_schema, format_checker=checker).validate(event)

    assert len(events) == manifest["event_count"]
    assert len({event["event_id"] for event in events}) == len(events)
    frozen_at = datetime.fromisoformat(manifest["frozen_at"])
    assert all(datetime.fromisoformat(event["known_at"]) <= frozen_at for event in events)
    assert all(datetime.fromisoformat(event["known_at"]) > frozen_at for event in delta["events"])
    assert delta["parent_snapshot_id"] == manifest["snapshot_id"]

    snapshot_ids = {event["event_id"] for event in events}
    for event in delta["events"]:
        supersedes = event["supersedes_event_id"]
        if supersedes is not None:
            assert supersedes in snapshot_ids

    assert _canonical_fingerprint(manifest, events) == manifest["fingerprint_sha256"]


def test_week1_pack_keeps_fact_status_separate_from_model_treatment():
    manifest = _load(PACK / "frozen-snapshot.json")
    events = []
    for shard_name in manifest["event_files"]:
        events.extend(_load(PACK / shard_name))

    # A reported or observed item may still be actionable, but the two axes
    # must remain independent and explicit.
    assert {event["fact_status"] for event in events} >= {"CONFIRMED", "REPORTED", "OBSERVED"}
    assert {event["model_treatment"] for event in events} >= {
        "IMMEDIATE_UPDATE",
        "PARTIAL_UPDATE",
        "WATCH_ONLY",
        "CONTEXT_ONLY",
    }
