from __future__ import annotations

from pathlib import Path
from typing import Any

from echocode.agents.base import BaseAgent
from echocode.utils.files import write_text_file


class ArchitectAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(name="architect_agent")

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        requirement = payload["requirement"]

        architecture_doc = f"""# Architecture: {requirement["title"]}

## Overview
This system implements the requirement:
{requirement["description"]}

## Components
- CLI Interface
- Domain Models
- Services Layer
- Agent Orchestration Layer

## Data Flow
Input → PM Agent → Architect → Planning → Coding → Testing

## Constraints
- Must follow architecture manifest
- Must maintain traceability

## Risks
- Requirement ambiguity
- Drift between design and implementation
"""

        path = Path("docs/architecture") / f'{requirement["requirement_id"]}.md'
        write_text_file(path, architecture_doc)

        return {
            "agent": self.name,
            "status": "ok",
            "architecture_file": str(path),
        }