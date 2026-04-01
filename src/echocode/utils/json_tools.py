from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml


def load_json_file(path: Path) -> dict[str, Any]:
    data: Any = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise TypeError(f"Expected JSON object in {path}, got {type(data).__name__}")
    return data


def load_yaml_file(path: Path) -> dict[str, Any]:
    data: Any = yaml.safe_load(path.read_text(encoding="utf-8"))
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise TypeError(f"Expected YAML object in {path}, got {type(data).__name__}")
    return data