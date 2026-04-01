from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ModelAdapter:
    provider: str
    model: str

    def describe(self) -> str:
        return f"{self.provider}:{self.model}"