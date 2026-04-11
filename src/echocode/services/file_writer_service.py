from __future__ import annotations

from pathlib import Path

from echocode.utils.files import write_text_file


class FileWriterService:
    def write_markdown(self, path: Path, title: str, content: list[str]) -> None:
        body = f"# {title}\n\n" + "\n".join(content)
        write_text_file(path, body)