from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from echocode.domain.models import WorkItem


@dataclass
class TraceabilityService:
    records: list[dict[str, Any]] = field(default_factory=list)

    def link_work_item(
        self,
        requirement_ids: list[str],
        work_item: WorkItem,
    ) -> dict[str, Any]:
        record: dict[str, Any] = {
            "work_item_id": work_item.work_item_id,
            "requirement_ids": requirement_ids,
            "design_ids": work_item.design_ids,
            "expected_outcomes": work_item.expected_outcomes,
            "status": work_item.status.value,
        }
        self.records.append(record)
        return record