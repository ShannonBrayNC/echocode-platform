from __future__ import annotations

from typing import Any

from echocode.agents.base import BaseAgent
from echocode.domain.models import Requirement
from echocode.domain.validators import validate_requirement_payload


class PMAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(name="pm_agent")

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        validate_requirement_payload(payload)
        requirement = Requirement.model_validate(payload)

        return {
            "agent": self.name,
            "status": "ok",
            "requirement_id": requirement.requirement_id,
            "title": requirement.title,
            "next_action": "human_requirement_approval",
            "summary": (
                "Requirement has been normalized and is ready for baseline approval."
            ),
        }