from __future__ import annotations


class RepairService:
    def attempt_fix(self, failure_output: str) -> str:
        return f"No automatic fix applied. Review required.\n\n{failure_output}"