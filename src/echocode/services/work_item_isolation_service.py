from __future__ import annotations

import re
from typing import Any


class WorkItemIsolationService:
    def _safe_name(self, value: str) -> str:
        return re.sub(r"[^a-z0-9_]", "_", value.lower())

    def build_code_target(self, work_item: dict[str, Any]) -> str:
        requirement_id = self._safe_name(work_item["requirement_ids"][0])
        wi_id = self._safe_name(work_item["work_item_id"])
        return f"src/echocode/generated/{requirement_id}_{wi_id}.py"

    def build_test_target(self, work_item: dict[str, Any]) -> str:
        wi_id = self._safe_name(work_item["work_item_id"])
        return f"tests/generated/test_{wi_id}.py"

    def normalize_work_item(self, work_item: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(work_item)

        code_target = self.build_code_target(normalized)
        test_target = self.build_test_target(normalized)

        normalized["allowed_files"] = [code_target]
        normalized["code_target"] = code_target
        normalized["test_target"] = test_target

        return normalized