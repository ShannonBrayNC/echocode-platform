from __future__ import annotations

import secrets


def _new_id(prefix: str) -> str:
    token = secrets.token_hex(4).upper()
    return f"{prefix}-{token}"


def new_requirement_id() -> str:
    return _new_id("REQ")


def new_work_item_id() -> str:
    return _new_id("WI")


def new_evidence_id() -> str:
    return _new_id("EVD")