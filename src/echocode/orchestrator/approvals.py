from __future__ import annotations

from pydantic import BaseModel


class ApprovalDecision(BaseModel):
    gate_name: str
    approved: bool
    approver: str
    notes: str = ""