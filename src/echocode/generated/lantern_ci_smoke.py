"""Minimal generated artifact for the legacy EchoCode CI workflow.

The EchoCode CI workflow validates that generated Python artifacts still exist.
This module is intentionally deterministic and side-effect free.
"""

from __future__ import annotations


def validate_lantern_ci_contract() -> dict[str, str | bool]:
    """Return the expected generated-artifact contract for CI validation."""

    return {
        "component": "echocodex",
        "lantern_protocol_ready": True,
        "ci_contract": "generated-python-smoke",
    }
