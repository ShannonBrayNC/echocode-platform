from __future__ import annotations

from typing import Any

from echocode.agents.architect_agent import ArchitectAgent
from echocode.agents.pm_agent import PMAgent
from echocode.orchestrator.execution_loop import ExecutionLoop
from echocode.services.planning_service import PlanningService


class WorkflowEngine:
    def __init__(self) -> None:
        self.pm = PMAgent()
        self.architect = ArchitectAgent()
        self.planner = PlanningService()
        self.executor = ExecutionLoop()

    def run(self, requirement_payload: dict[str, Any]) -> dict[str, Any]:
        pm_result = self.pm.run(requirement_payload)

        arch_result = self.architect.run(
            {
                "requirement": requirement_payload,
            }
        )

        work_items = self.planner.decompose(requirement_payload)

        execution_results: list[dict[str, Any]] = []
        for wi in work_items:
            execution_results.append(self.executor.run(wi))

        return {
            "pm": pm_result,
            "architecture": arch_result,
            "work_items": work_items,
            "execution": execution_results,
        }