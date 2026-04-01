from __future__ import annotations

from pathlib import Path
from typing import Any


class ArchitectureGuardService:
    def validate_allowed_files(self, work_item: dict[str, Any]) -> tuple[bool, str]:
        allowed_files = work_item.get("allowed_files", [])
        if not allowed_files:
            return False, "No allowed_files defined."

        for file_path in allowed_files:
            normalized = str(file_path).replace("\\", "/")
            if not normalized.startswith("src/echocode/generated/"):
                return False, f"Disallowed target file: {file_path}"

        return True, "Allowed files validated."

    def validate_generated_file_exists(self, path: str) -> tuple[bool, str]:
        if Path(path).exists():
            return True, "Generated file exists."
        return False, f"Generated file missing: {path}"