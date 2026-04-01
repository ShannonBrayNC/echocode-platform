from __future__ import annotations

from pydantic import BaseModel, Field


class HandoffPayload(BaseModel):
    source_agent: str
    target_agent: str
    context: dict[str, object] = Field(default_factory=dict)
    required_artifacts: list[str] = Field(default_factory=list)