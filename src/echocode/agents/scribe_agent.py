from __future__ import annotations

from typing import Any

from echocode.agents.base import BaseAgent
from echocode.domain.models import Requirement, WorkItem


class ScribeAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(name="scribe_agent")

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        kind = payload.get("kind")

        if kind == "requirement":
            requirement = Requirement.model_validate(payload["data"])
            return {
                "agent": self.name,
                "status": "ok",
                "artifact_type": "requirement_doc",
                "artifact_name": f"{requirement.requirement_id}.md",
                "content_preview": [
                    f"# {requirement.requirement_id}: {requirement.title}",
                    "",
                    requirement.description,
                ],
            }

        if kind == "work_item":
            work_item = WorkItem.model_validate(payload["data"])
            return {
                "agent": self.name,
                "status": "ok",
                "artifact_type": "work_item_doc",
                "artifact_name": f"{work_item.work_item_id}.md",
                "content_preview": [
                    f"# {work_item.work_item_id}: {work_item.title}",
                    "",
                    "## Expected Outcomes",
                    *[f"- {item}" for item in work_item.expected_outcomes],
                ],
            }

        return {
            "agent": self.name,
            "status": "error",
            "message": "Unsupported payload kind for scribe agent.",
        }