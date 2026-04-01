from __future__ import annotations

from pathlib import Path

from echocode.utils.files import ensure_directory, write_text_file


class RepoController:
    def __init__(self) -> None:
        self.branch_root = Path("artifacts/branches")
        ensure_directory(self.branch_root)

    def create_branch_structure(self, work_item_id: str) -> Path:
        path = self.branch_root / work_item_id
        ensure_directory(path)
        return path

    def write_branch_note(self, work_item_id: str, message: str) -> str:
        branch_dir = self.create_branch_structure(work_item_id)
        note_path = branch_dir / "branch-note.txt"
        write_text_file(note_path, message)
        return str(note_path)

    def simulate_commit(self, work_item_id: str, message: str) -> dict[str, str]:
        note_path = self.write_branch_note(work_item_id, f"COMMIT: {message}")
        return {
            "work_item_id": work_item_id,
            "message": message,
            "branch_note": note_path,
        }

    def simulate_pr(self, work_item_id: str, title: str, body: str) -> dict[str, str]:
        branch_dir = self.create_branch_structure(work_item_id)
        pr_path = branch_dir / "pull-request.md"
        write_text_file(pr_path, f"# {title}\n\n{body}\n")
        return {
            "work_item_id": work_item_id,
            "pr_file": str(pr_path),
        }