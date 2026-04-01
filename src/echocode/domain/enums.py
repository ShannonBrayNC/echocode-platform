from __future__ import annotations

from enum import Enum


class RequirementStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    IMPLEMENTED = "implemented"
    REJECTED = "rejected"


class WorkItemStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"


class EvidenceStatus(str, Enum):
    DRAFT = "draft"
    COMPLETE = "complete"