from __future__ import annotations

from pathlib import Path

from echocode.utils.files import read_text_file


class PromptLoader:
    def __init__(self, docs_prompts_root: Path) -> None:
        self.docs_prompts_root = docs_prompts_root

    def load(self, filename: str) -> str:
        return read_text_file(self.docs_prompts_root / filename)