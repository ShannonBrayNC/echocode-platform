from __future__ import annotations

from pydantic import BaseModel, Field


class WorkflowState(BaseModel):
    workflow_id: str
    current_stage: str
    status: str = "active"
    notes: list[str] = Field(default_factory=list)