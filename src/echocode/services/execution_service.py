from __future__ import annotations

import subprocess


class ExecutionService:
    def run_tests(self) -> tuple[bool, str]:
        result = subprocess.run(
            ["pytest", "tests/generated", "-q"],
            capture_output=True,
            text=True,
        )
        return result.returncode == 0, result.stdout + result.stderr