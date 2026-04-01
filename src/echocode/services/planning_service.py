from __future__ import annotations

from typing import Any

from echocode.domain.ids import new_work_item_id


class PlanningService:
    def decompose(self, requirement: dict[str, Any]) -> list[dict[str, Any]]:
        title = str(requirement["title"])
        requirement_id = str(requirement["requirement_id"])

        return [
            {
                "work_item_id": new_work_item_id(),
                "title": f"{title} - Core Implementation",
                "requirement_ids": [requirement_id],
                "expected_outcomes": [
                    "Core logic implemented",
                    "Basic validation working",
                ],
                "status": "planned",
            },
            {
                "work_item_id": new_work_item_id(),
                "title": f"{title} - Testing",
                "requirement_ids": [requirement_id],
                "expected_outcomes": [
                    "Unit tests created",
                    "Edge cases covered",
                ],
                "status": "planned",
            },
        ]