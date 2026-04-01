from __future__ import annotations

from pathlib import Path
from typing import Any

from echocode.agents.base import BaseAgent
from echocode.utils.files import write_text_file


class TestAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(name="test_agent")

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        work_item = payload["work_item"]
        allowed_files = work_item.get("allowed_files", [])

        if not allowed_files:
            return {
                "agent": self.name,
                "status": "error",
                "message": "No allowed_files specified.",
            }

        file_path = allowed_files[0]

        # 🔥 FIX: remove "src." prefix for import
        module_path = (
            file_path
            .replace("\\", "/")
            .replace("src/", "")  # <-- THIS IS THE FIX
            .replace("/", ".")
            .removesuffix(".py")
        )

        test_path = Path("tests/generated") / f'test_{work_item["work_item_id"].lower()}.py'

        test_code = f'''def test_execution() -> None:
    from {module_path} import execute

    result = execute()

    assert result is not None
    assert isinstance(result, str)
'''

        write_text_file(test_path, test_code)

        return {
            "agent": self.name,
            "status": "ok",
            "test_file": str(test_path),
        }