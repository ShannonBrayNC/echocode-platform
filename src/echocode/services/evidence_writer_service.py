from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from echocode.utils.files import ensure_directory, write_text_file


class EvidenceWriterService:
    def __init__(self) -> None:
        self.output_dir = Path("artifacts/evidence")
        ensure_directory(self.output_dir)

    def write(self, work_item_id: str, payload: dict[str, Any]) -> str:
        path = self.output_dir / f"{work_item_id}.json"
        write_text_file(path, json.dumps(payload, indent=2))
        return str(path)