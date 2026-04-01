from __future__ import annotations


import jsonschema

from echocode.app import PROJECT_ROOT
from echocode.utils.json_tools import load_json_file


def _load_schema(schema_name: str) -> dict:
    schema_path = PROJECT_ROOT / "schemas" / schema_name
    return load_json_file(schema_path)


def validate_requirement_payload(payload: dict) -> None:
    schema = _load_schema("requirement.schema.json")
    jsonschema.validate(instance=payload, schema=schema)


def validate_work_item_payload(payload: dict) -> None:
    schema = _load_schema("work-item.schema.json")
    jsonschema.validate(instance=payload, schema=schema)


def validate_evidence_bundle_payload(payload: dict) -> None:
    schema = _load_schema("evidence-bundle.schema.json")
    jsonschema.validate(instance=payload, schema=schema)