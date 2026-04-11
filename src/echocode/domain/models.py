from __future__ import annotations

from pydantic import BaseModel, Field

from echocode.domain.enums import EvidenceStatus, RequirementStatus, WorkItemStatus


class Requirement(BaseModel):
    requirement_id: str
    title: str
    description: str
    acceptance_criteria: list[str]
    assumptions: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    status: RequirementStatus


class WorkItem(BaseModel):
    work_item_id: str
    title: str
    requirement_ids: list[str]
    design_ids: list[str] = Field(default_factory=list)
    expected_outcomes: list[str]
    allowed_files: list[str] = Field(default_factory=list)
    status: WorkItemStatus


class EvidenceBundle(BaseModel):
    evidence_id: str
    work_item_id: str
    summary: str
    artifacts: list[str]
    notes: list[str] = Field(default_factory=list)
    status: EvidenceStatus